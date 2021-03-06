'use strict'

const CashFlow = require('../models/cashFlow');
const CashFlowDAO = require('../dataAccess/cashFlow');
const CashFlowTransform = require('../transformers/cashFlow');
const CashCountService = require('../services/arqueoCaja');
const CashFlowTypes = require('../shared/enums/cashFlowTypes');
const CashInTypes = require('../shared/enums/cashInTypes');
const CashOutTypes = require('../shared/enums/cashOutTypes');

/**
 * @description Devuelve el cash flow con id igual al dado como parametro
 * @param {ObjectId} cashFlowId id del cash flow que se quiere recuperar.
 * @returns {*} cashFlow transformado al modelo usado en el frontend
 */
async function getCashFlow(cashFlowId) {
  try {
    let cashFlow = await CashFlowDAO.getCashFlowById(cashFlowId);

    return CashFlowTransform.transformToBusinessObject(cashFlow);
  }
  catch (err) {
    throw new Error(err.message);
  }
}

/**
 * @description Devuelve todos los cashFlows transformados al modelo que se usa en el
 * front end.
 * @returns {*} cashFlowsReturned cashFlows transformados.
 */
async function getAll() {
  try {
    let cashFlowsReturned = [];
    let cashFlows = await CashFlowDAO.getCashFlowsByQuery({});

    for (let i = 0; i < cashFlows.length; i++) {
      const cashFlowTransformed = await CashFlowTransform.transformToBusinessObject(cashFlows[i]);
      cashFlowsReturned.push(cashFlowTransformed);
    }

    return cashFlowsReturned;
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * @description Recupera de la base de datos los movimientos de caja para la caja registradora dada como parámetro 
 * con fecha mayor a la fecha dada.
 * @param {ObjectId} cashRegisterId 
 * @param {Date} date 
 * @returns {CashFlow[]} cashFlows recuperados de la base de datos
 */
async function getCashFlowByCashRegisterAndDate(cashRegisterId, date) {
  try {
    let query = { cashRegisterId: cashRegisterId, deleted: false, date: { "$gte": date } };
    let cashFlows = await CashFlowDAO.getCashFlowsByQuery(query);

    return cashFlows;
  }
  catch (err) {
    throw new Error(err.message);
  }
}

/**
 * @description Recupera un unico cashFlow con cashRegisterId igual al dado como parametro. Si hay mas de uno
 * devuelve el primero que encuentra.
 * @param {string} cashRegisterId 
 * @returns primer cashFlow encontrado con cashRegisterId igual al dado como parametro.
 */
async function retrieveOneCashFlowForCashRegister(cashRegisterId) {
  try {
    let query = { cashRegisterId: cashRegisterId };
    let cashFlow = await CashFlowDAO.getOneCashFlowByQuery(query);
    
    return cashFlow;
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * @description Actualiza el cashFlow con id igual al dado como parametro en la base de datos.
 * @param {ObjectId} cashFlowId 
 * @param {JSON} bodyUpdate 
 */
async function update(cashFlowId, bodyUpdate) {
  try {
    let cashFlowUpdated = await CashFlowDAO.updateCashFlowById(cashFlowId, bodyUpdate);

    if (cashFlowUpdated.deleted === true) {
      await removeCashFlowFromCashCount(cashFlowUpdated);
    }

    return CashFlowTransform.transformToBusinessObject(cashFlowUpdated);
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * @description Realiza la baja lógica del cashFlow con id igual al dado como parametro en la base de datos.
 * @param {ObjectId} cashFlowId 
 * @param {JSON} bodyUpdate 
 */
async function logicalDelete(cashFlowId) {
  try {
    //TODO: recuperar el id del usuario del token y reemplazarlo en el deletedBy
    let bodyUpdate = {
      deleted: true,
      deletedBy: "5d38ebfcf361ae0cabe45a8e"
    }
    let cashFlowUpdated = await CashFlowDAO.updateCashFlowById(cashFlowId, bodyUpdate);

    await removeCashFlowFromCashCount(cashFlowUpdated);    

    return CashFlowTransform.transformToBusinessObject(cashFlowUpdated);
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * @description Devuelve el nuevo cashFlow guardado en la base de datos transformado al modelo que se usa en el
 * frontend.
 * @param {*} cashFlowReq cashFlow recibido en el objeto req en el controller
 * @returns cashFlow transformado
 */
async function saveCashFlow(cashFlowReq) {
  try {
    let cashFlow = createCashFlow(cashFlowReq);

    let cashFlowSaved = await CashFlowDAO.save(cashFlow);
    await saveCashFlowIntoCashCount(cashFlow);

    return CashFlowTransform.transformToBusinessObject(cashFlowSaved);
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * @description Guarda el nuevo cashFlow en el arqueo abierto en la caja en la que se realizó el moviemiendo si existe.
 * @param {CashFlow} cashFlow 
 */
async function saveCashFlowIntoCashCount(cashFlow) {
  try {
    let cashCount = null;

    try {
      if (cashFlow.cashRegisterId !== null && cashFlow.cashRegisterId !== undefined) {
        cashCount = await CashCountService.getArqueoOpenByCashRegister(cashFlow.cashRegisterId);
      } else {
        throw new Error("La caja registradora del movimiento no puede ser nula");
      }
    } catch (err) {
      throw new Error(err.message);
    }

    //Si se encontro un arqueo abierto para la caja registradora del movimiento se agrega el mismo al array
    //de ingresos o egresos del arqueo según corresponda
    if (cashCount !== null && cashCount !== undefined) {
      if (cashFlow.type === CashFlowTypes.INGRESO) {
        if (cashCount.ingresos === null || cashCount.ingresos === undefined) {
          cashCount.ingresos = new Array();
        }

        cashCount.ingresos.push({
          paymentType: cashFlow.paymentType,
          desc: CashInTypes.MOVIMIENTO_DE_CAJA,
          amount: cashFlow.totalAmount,
          date: cashFlow.date
        })
      }
      else if (cashFlow.type === CashFlowTypes.EGRESO) {
        if (cashCount.egresos === null || cashCount.egresos === undefined) {
          cashCount.egresos = new Array();
        }

        cashCount.egresos.push({
          paymentType: cashFlow.paymentType,
          desc: CashOutTypes.MOVIMIENTO_DE_CAJA,
          amount: cashFlow.totalAmount,
          date: cashFlow.date
        })
      }

      await CashCountService.update(cashCount.id, cashCount);
    }

  } catch (err) {
    await deleteCashFlow(cashFlow.id);
    throw new Error(err.message);
  }
}

async function removeCashFlowFromCashCount(cashFlow) {
  try {
    let cashCount = null;

    try {
      if (cashFlow.cashRegisterId !== null && cashFlow.cashRegisterId !== undefined) {
        cashCount = await CashCountService.getArqueoOpenByCashRegister(cashFlow.cashRegisterId);
      } else {
        throw new Error("La caja registradora del movimiento no puede ser nula");
      }
    } catch (err) {
      throw new Error(err.message);
    }

    if (cashCount !== null && cashCount !== undefined) {
      if (cashFlow.type === CashFlowTypes.INGRESO) {
        if (cashCount.ingresos !== null && cashCount.ingresos !== undefined) {
          let index = findMovementIndexInCashCount(cashCount.ingresos, cashFlow);

          if (index !== -1) {
            cashCount.ingresos.splice(index, 1);
          }
        }
      }
      else if (cashFlow.type === CashFlowTypes.EGRESO) {
        if (cashCount.egresos !== null && cashCount.egresos !== undefined) {
          let index = findMovementIndexInCashCount(cashCount.egresos, cashFlow);

          if (index !== -1) {
            cashCount.egresos.splice(index, 1);
          }
        }
      }

      await CashCountService.update(cashCount.id, cashCount);
    }

  } catch (err) {
    let cashFlowToRestore = { deleted: false };
    await CashFlowDAO.updateCashFlowById(cashFlow.id, cashFlowToRestore);
    throw new Error(`El movimiento de caja no pudo ser eliminado (${err.message})`);
  }
}

/**
 * @description Devuelve el indice del elemento dado dentro del array de ingresos o egresos 
 * del cashCount dado como parametro.
 * @param {Array} array Ingresos/egresos del que se quiere obtener el indice del elemento.
 * @param {*} element Ingreso/Egreso del cual se quiere obtener el indice.
 */
function findMovementIndexInCashCount(array, element) {
  for (let i = 0; i < array.length; i++) {
    const movement = array[i];

    if (movement.paymentType.toString() === element.paymentType.toString() &&
      movement.amount === element.totalAmount &&
      movement.desc === CashInTypes.MOVIMIENTO_DE_CAJA &&
      movement.date.toString() === element.date.toString()) {

      return i;
    }
  }

  return -1;
}

/**
 * @description Crea un nuevo cashFlow.
 * @param {*} cashFlowObject 
 * @returns cashFlow nuevo cashFlow.
 */
function createCashFlow(cashFlowObject) {
  let cashFlow = new CashFlow();
  cashFlow.cashRegisterId = cashFlowObject.cashRegisterId;
  cashFlow.date = new Date();
  cashFlow.createdBy = cashFlowObject.createdBy;
  cashFlow.totalAmount = cashFlowObject.totalAmount;
  cashFlow.type = cashFlowObject.type;
  cashFlow.paymentType = cashFlowObject.paymentType;
  cashFlow.comment = cashFlowObject.comment;
  cashFlow.deleted = false;

  return cashFlow;
}

/**
 * @description Elimina el cashFlow con id igual al dado como parametro de la base de datos.
 * @param {ObjectID} cashFlowId id del cashFlow que se quiere eliminar
 */
async function deleteCashFlow(cashFlowId) {
  try {
    let cashFlow = await CashFlowDAO.getCashFlowById(cashFlowId);
    await CashFlowDAO.remove(cashFlow);
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = {
  getCashFlow,
  getAll,
  getCashFlowByCashRegisterAndDate,
  saveCashFlow,
  update,
  deleteCashFlow,
  retrieveOneCashFlowForCashRegister,
  logicalDelete
}
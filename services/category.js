'use strict'

const mongoose = require('mongoose');
const Category = require('../models/category');
const CategoryTransform = require('../transformers/category');
const CategoryDAO = require('../dataAccess/category');
const ProductDAO = require('../dataAccess/product');

async function getAll() {
  try {
    let categoriesToReturn = [];
    let sortCondition = { name: 1 };
    let categories = await CategoryDAO.getCategoriesSortedByQuery({}, sortCondition);

    if (categories !== null && categories !== undefined) {
      for (let i = 0; i < categories.length; i++) {
        const categoryTransformed = await CategoryTransform.transformToBusinessObject(categories[i]);
        categoriesToReturn.push(categoryTransformed);
      }
    }

    return categoriesToReturn;
  } catch (err) {
    throw new Error(err.message);
  }
}

//Devuelve todas las categorias disponibles
async function getAllAvailables() {
  try {
    let categoriesToReturn = [];
    let sortCondition = { name: 1 };
    let categories = await CategoryDAO.getCategoriesSortedByQuery({available: true}, sortCondition);

    if (categories !== null && categories !== undefined) {
      for (let i = 0; i < categories.length; i++) {
        const categoryTransformed = await CategoryTransform.transformToBusinessObject(categories[i]);
        categoriesToReturn.push(categoryTransformed);
      }
    }

    return categoriesToReturn;
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * Devuelve la categoría con id igual al dado como parametro
 * @param {string} categoryId id de la categoría que se quiere recuperar.
 */
async function getCategory(categoryId) {
  try {
    let category = null;
    if (categoryId === null || categoryId === undefined) {
      throw new Error('Se debe especificar el id de la categoría que se quiere obtener de la base de datos');
    }

    category = await CategoryDAO.getCategoryById(categoryId);

    if (category !== null && category !== undefined) {
      category = CategoryTransform.transformToBusinessObject(category);
    }

    return category;
  }
  catch (err) {
    throw new Error(err);
  }
}

async function getCategoriesByMenu(menuId) {
  try {
    if (menuId === null || menuId === undefined) {
      throw new Error('Se debe especificar el menú para el que se quieren obtener las categorías');
    }
    let categoriesToReturn = [];
    let query = { menuId: menuId };
    let sortCondition = { name: 1 };
    let categories = await CategoryDAO.getCategoriesSortedByQuery(query, sortCondition);

    if (categories !== null && categories !== undefined) {
      for (let i = 0; i < categories.length; i++) {
        const categoryTransformed = await CategoryTransform.transformToBusinessObject(categories[i]);
        categoriesToReturn.push(categoryTransformed);
      }
    }

    return categoriesToReturn;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getCategoriesAvailablesByMenu(menuId) {
  try {
    if (menuId === null || menuId === undefined) {
      throw new Error('Se debe especificar el menú para el que se quieren obtener las categorías');
    }
    let categoriesToReturn = [];
    let query = { menuId: menuId, available: true };
    let sortCondition = { name: 1 };
    let categories = await getCategoriesWithProducts(await CategoryDAO.getCategoriesSortedByQuery(query, sortCondition));

    if (categories !== null && categories !== undefined) {
      for (let i = 0; i < categories.length; i++) {
        const categoryTransformed = await CategoryTransform.transformToBusinessObject(categories[i]);
        categoriesToReturn.push(categoryTransformed);
      }
    }

    return categoriesToReturn;
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * @description Devuelve aquellas categorías del array dado como parámetro que tienen productos asociados.
 * @param {Cateogry[]} categories 
 * @returns {Category[]} categorías que tienen productos asociados.
 */
async function getCategoriesWithProducts(categories) {    
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const query = { category: category._id, available:true }
    const products = await ProductDAO.getProductsByQuery(query);
    if (!products || products.length === 0) {
      categories.splice(i, 1);
      i--;
    }
  }

  return categories;
}

/**
 * @description Recupera de la base de datos el primer producto que se encuentre para la categoría dada
 * como parámetro.
 * @param {string} categoryId 
 * @returns true si existe al menos un producto para la categoría. False si no hay ninguno.
 */
async function hasAtLeastOneProduct(categoryId) {
  try {
    let query = { category: categoryId };
    let product = await ProductDAO.getOneProductByQuery(query);

    return product;
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * @description Crea una nueva catgegoría con los datos dados como parametros y la guarda en la base de datos.
 * @param {Category} category
 * @returns categorySaved guardada en la base de datos.
 */
async function saveCategory(category) {
  let categorySaved = await CategoryDAO.save(category);

  if (categorySaved !== null && categorySaved !== undefined) {
    categorySaved = CategoryTransform.transformToBusinessObject(categorySaved);
  }

  return categorySaved;
}

/**
 * @description Actualiza la categoría con id igual al dado como parametro en la base de datos.
 * @param {String} categoryId id de la categoría a actualizar.
 * @param {JSON} bodyUpdate datos a actualizar en la base de datos.
 * @returns la categoria actualizada y convertida al modelo usado en el frontend.
 */
async function update(categoryId, bodyUpdate) {
  try {
    let categoryUpdated = await CategoryDAO.updateCategoryById(categoryId, bodyUpdate);

    if (categoryUpdated !== null && categoryUpdated !== undefined) {
      categoryUpdated = CategoryTransform.transformToBusinessObject(categoryUpdated);
    }

    return categoryUpdated;
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * @description Elimina la categoría con id igual al dado como parametro de la base de datos.
 * @param {String} categoryId id de la categoría que se quiere eliminar
 */
async function deleteCategory(categoryId) {
  try {
    let category = await CategoryDAO.getCategoryById(categoryId);
    await CategoryDAO.remove(category);
  } catch (err) {
    throw new Error(err.message);
  }
}
async function disableCategoryAndProducts(categoryId) {
//Transaccion inhabilita categoria y productos.
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const opts = { session: session, new: true };
    await CategoryDAO.updateCategoryById(categoryId, {available: false}, opts);

    let products = await ProductDAO.updateManyProductsByQuery({category: categoryId}, {available: false}, opts);

    await session.commitTransaction();
    session.endSession();  
  } catch (err) {
    // If an error occurred, abort the whole transaction and
    // undo any changes that might have happened
    await session.abortTransaction();
    session.endSession();
    throw new Error(err.message);
  }

}

module.exports = {
  getAll,
  getAllAvailables,
  getCategory,
  getCategoriesByMenu,
  getCategoriesAvailablesByMenu,
  hasAtLeastOneProduct,
  saveCategory,
  update,
  deleteCategory,
  disableCategoryAndProducts
}
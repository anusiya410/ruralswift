// server/src/services/product.service.js
'use strict';

const productRepo = require('../repositories/product.repository');

class ProductService {

  async listProducts({ category, search, minPrice, maxPrice, page = 1, limit = 20, sellerId, isApproved } = {}) {
    const offset = (page - 1) * limit;
    const [products, total] = await Promise.all([
      productRepo.findAll({ category, search, minPrice, maxPrice, limit: Number(limit), offset, sellerId, isApproved }),
      productRepo.count({ category, search, minPrice, maxPrice, sellerId, isApproved })
    ]);
    return {
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getProduct(productId) {
    const product = await productRepo.findById(productId);
    if (!product) throw new Error(`Product ${productId} not found.`);
    return product;
  }

  async createProduct(sellerId, data) {
    if (!data.name || !data.name.trim()) throw new Error('Product name is required.');
    if (!data.category || !data.category.trim()) throw new Error('Product category is required.');
    if (data.price === undefined || data.price < 0) throw new Error('Valid price is required.');
    if (data.stock === undefined || data.stock < 0) throw new Error('Valid stock quantity is required.');

    return productRepo.create({ sellerId, ...data });
  }

  async updateProduct(productId, sellerId, data) {
    const product = await productRepo.update(productId, sellerId, data);
    if (!product) throw new Error('Product not found or you do not have permission to edit it.');
    return product;
  }

  async deleteProduct(productId, sellerId) {
    const product = await productRepo.softDelete(productId, sellerId);
    if (!product) throw new Error('Product not found or you do not have permission to delete it.');
    return product;
  }

  async getCategories() {
    return productRepo.getCategories();
  }
}

module.exports = new ProductService();

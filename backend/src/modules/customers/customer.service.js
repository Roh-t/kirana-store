import { Customer } from './customer.model.js';
import { ApiError } from '../../utils/apiError.js';

export class CustomerService {
  static async findOrCreateCustomer(storeId, phone, name = 'Guest Customer') {
    let customer = await Customer.findOne({ storeId, phone });
    if (!customer) {
      customer = await Customer.create({
        storeId,
        phone,
        name,
        totalOrders: 0,
        totalSpent: 0,
        udharBalance: 0,
        isGuest: true,
        status: 'ACTIVE'
      });
    }
    return customer;
  }

  static async createCustomer(storeId, validatedData) {
    const existing = await Customer.findOne({ storeId, phone: validatedData.phone });
    if (existing) {
      throw ApiError.conflict(`Customer with phone number "${validatedData.phone}" already exists in your store.`);
    }

    return Customer.create({
      storeId,
      ...validatedData,
      totalOrders: 0,
      totalSpent: 0,
      status: 'ACTIVE'
    });
  }

  static async getCustomersByStore(storeId, options = {}) {
    const { search, hasUdhar, page = 1, limit = 20 } = options;
    const query = { storeId, status: 'ACTIVE' };

    if (hasUdhar === 'true') {
      query.udharBalance = { $gt: 0 };
    }

    if (search && search.trim().length > 0) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { phone: searchRegex }];
    }

    const skip = (page - 1) * limit;

    const [customers, totalRecords, udharAggregate] = await Promise.all([
      Customer.find(query)
        .sort({ udharBalance: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Customer.countDocuments(query),
      Customer.aggregate([
        { $match: { storeId: storeId, status: 'ACTIVE' } },
        { $group: { _id: null, totalUdhar: { $sum: '$udharBalance' } } }
      ])
    ]);

    const totalUdharBalance = udharAggregate[0]?.totalUdhar || 0;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return {
      customers,
      totalUdharBalance,
      pagination: {
        totalRecords,
        currentPage: Number(page),
        totalPages,
        pageSize: Number(limit)
      }
    };
  }

  static async getCustomerById(storeId, customerId) {
    const customer = await Customer.findOne({ _id: customerId, storeId });
    if (!customer) {
      throw ApiError.notFound('Customer profile not found');
    }
    return customer;
  }

  static async updateUdharBalance(storeId, customerId, amountDelta, notes) {
    const customer = await Customer.findOne({ _id: customerId, storeId });
    if (!customer) {
      throw ApiError.notFound('Customer profile not found');
    }

    const newBalance = customer.udharBalance + amountDelta;
    customer.udharBalance = Math.max(0, newBalance);
    await customer.save();

    return customer;
  }
}
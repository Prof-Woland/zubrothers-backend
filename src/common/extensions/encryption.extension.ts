import { EncryptionService } from '../../encryption/encryption.service';

export const encryptionExtension = (encryption: EncryptionService) => {
  const encryptionMap: Record<string, string[]> = {
    User: ['email', 'phone', 'name', 'surname', 'patronymic', 'telegram'],
    Profile: ['bio'],
  };

  const getFields = (model: string) => encryptionMap[model] ?? [];

  const encryptData = (model: string, data: any): any => {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map((item) => encryptData(model, item));
    }

    if (typeof data !== 'object') return data;

    const copy = { ...data };

    for (const [key, value] of Object.entries(copy)) {
      if (value && typeof value === 'object') {
        copy[key] = encryptData(key, value);
        continue;
      }

      const fields = getFields(model);
      if (fields.includes(key) && typeof value === 'string') {
        if (!value.includes(':')) {
          copy[key] = encryption.encrypt(value);
        }
      }
    }

    return copy;
  };

  const decryptData = (model: string, data: any): any => {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map((item) => decryptData(model, item));
    }

    if (typeof data !== 'object') return data;

    const copy = { ...data };
    const fields = getFields(model);

    for (const [key, value] of Object.entries(copy)) {
      if (value && typeof value === 'object') {
        copy[key] = decryptData(key, value);
        continue;
      }

      if (fields.includes(key) && typeof value === 'string' && value.includes(':')) {
        try {
          copy[key] = encryption.decrypt(value);
        } catch {}
      }
    }

    return copy;
  };

  return {
    query: {
      $allModels: {
        async create({ model, args, query }) {
          args.data = encryptData(model, args.data);
          const result = await query(args);
          return decryptData(model, result);
        },

        async createMany({ model, args, query }) {
          if (args.data && Array.isArray(args.data)) {
            args.data = args.data.map((item) => encryptData(model, item));
          }
          return query(args);
        },

        async update({ model, args, query }) {
          args.data = encryptData(model, args.data);
          const result = await query(args);
          return decryptData(model, result);
        },

        async updateMany({ model, args, query }) {
          if (args.data) args.data = encryptData(model, args.data);
          return query(args); 
        },

        async upsert({ model, args, query }) {
          args.create = encryptData(model, args.create);
          args.update = encryptData(model, args.update);
          const result = await query(args);
          return decryptData(model, result);
        },

        async findUnique({ model, args, query }) {
          const result = await query(args);
          return decryptData(model, result);
        },

        async findFirst({ model, args, query }) {
          const result = await query(args);
          return decryptData(model, result);
        },

        async findMany({ model, args, query }) {
          const result = await query(args);
          return decryptData(model, result);
        },
      },
    },
  };
};
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Backend Jawara API',
      version: '1.0.0',
      description: 'API documentation for Backend Jawara - Sistem Manajemen RT/RW',
      contact: {
        name: 'Backend Jawara',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nama: { type: 'string' },
            email: { type: 'string', format: 'email' },
            nomor_telefon: { type: 'string' },
            role: { type: 'string', enum: ['adminSistem', 'ketuaRT', 'ketuaRW', 'bendahara', 'sekretaris', 'warga'] },
          },
        },
        Warga: {
          type: 'object',
          properties: {
            nik: { type: 'string', pattern: '^\\d{16}$' },
            namaWarga: { type: 'string' },
            jenisKelamin: { type: 'string', enum: ['Laki-laki', 'Perempuan'] },
            statusDomisili: { type: 'string' },
            statusHidup: { type: 'string' },
            keluargaId: { type: 'integer', nullable: true },
          },
        },
        Keluarga: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            namaKeluarga: { type: 'string' },
            jumlahAnggota: { type: 'integer' },
            rumahId: { type: 'integer', nullable: true },
            kepala_Keluarga_Id: { type: 'string', nullable: true },
          },
        },
        Rumah: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            statusKepemilikan: { type: 'string', enum: ['tetap', 'kontrak', 'pindah'] },
            alamat: { type: 'string' },
            jumlahPenghuni: { type: 'integer' },
            keluargaId: { type: 'integer', nullable: true },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
      },
    },
    security: [],
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);

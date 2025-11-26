# Backend Jawara - Sistem Manajemen RT/RW

Backend Express.js dengan ES Modules untuk sistem manajemen RT/RW dengan fitur marketplace terintegrasi AI untuk validasi kebersihan produk.

## 🚀 Fitur

- **Authentication & Authorization** - JWT-based auth dengan role-based access control
- **User Management** - Sistem user dengan berbagai role (adminSistem, ketuaRT, ketuaRW, bendahara, sekretaris, warga)
- **Warga Self-Registration** - Warga dapat mendaftar sendiri dengan upload KTP untuk verifikasi
- **Warga Verification System** - Admin approval untuk registrasi warga baru dan perubahan nama
- **Data Keluarga** - Manajemen data keluarga dengan kepala keluarga
- **Data Warga** - Manajemen data warga dengan NIK sebagai primary key dan status tracking
- **Data Rumah** - Manajemen rumah dengan status kepemilikan
- **MarketPlace** - Upload produk dengan validasi AI otomatis untuk kebersihan gambar
- **Swagger Documentation** - API documentation lengkap di `/api-docs`

## 📋 Prerequisites

- Node.js (v16 atau lebih tinggi)
- Supabase Account (untuk database & storage)
- NPM atau Yarn

## 🛠️ Installation

### Local Installation

```bash
# Clone repository
git clone <repository-url>
cd backend_jawara

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan konfigurasi Anda
```


## ⚙️ Environment Variables

Buat file `.env` dengan konfigurasi berikut:

```env
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

## 🗄️ Database Setup

### 1. Setup Supabase Tables

Buat tabel-tabel berikut di Supabase:

**Table: `user`**
```sql
CREATE TABLE "user" (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nomor_telefon TEXT,
  role TEXT DEFAULT 'warga',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Table: `rumah`**
```sql
CREATE TABLE rumah (
  id SERIAL PRIMARY KEY,
  statusKepemilikan TEXT NOT NULL,
  alamat TEXT NOT NULL,
  jumlahPenghuni INTEGER NOT NULL,
  keluargaId INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Table: `keluarga`**
```sql
CREATE TABLE keluarga (
  id SERIAL PRIMARY KEY,
  namaKeluarga TEXT NOT NULL,
  jumlahAnggota INTEGER NOT NULL,
  rumahId INTEGER REFERENCES rumah(id),
  kepala_Keluarga_Id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Table: `warga`**
```sql
CREATE TABLE warga (
  nik TEXT PRIMARY KEY,
  namaWarga TEXT NOT NULL,
  jenisKelamin TEXT NOT NULL,
  statusDomisili TEXT NOT NULL,
  statusHidup TEXT NOT NULL,
  keluargaId INTEGER REFERENCES keluarga(id),
  userId INTEGER REFERENCES "user"(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Table: `marketPlace`**
```sql
CREATE TABLE marketPlace (
  id SERIAL PRIMARY KEY,
  namaProduk TEXT NOT NULL,
  harga DECIMAL NOT NULL,
  deskripsi TEXT NOT NULL,
  gambar TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Table: `verification_warga`**
```sql
CREATE TABLE verification_warga (
  id SERIAL PRIMARY KEY,
  warga_id TEXT NOT NULL REFERENCES warga(nik),
  user_id INTEGER NOT NULL REFERENCES "user"(id),
  nik_baru TEXT NOT NULL,
  namaWarga_baru TEXT NOT NULL,
  foto_ktp TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  verified_by INTEGER REFERENCES "user"(id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Setup Supabase Storage

1. Buka Supabase Dashboard → Storage
2. Buat bucket baru bernama `marketplace` untuk produk
3. Buat bucket baru bernama `verification` untuk foto KTP verifikasi
4. Set bucket sebagai **Public** atau configure RLS policies:

**Bucket: marketplace**
```sql
-- Policy untuk INSERT
CREATE POLICY "Allow authenticated upload to marketplace"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marketplace');

-- Policy untuk SELECT
CREATE POLICY "Allow public to view marketplace"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'marketplace');

-- Policy untuk DELETE
CREATE POLICY "Allow authenticated delete from marketplace"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'marketplace');
```

**Bucket: verification**
```sql
-- Policy untuk INSERT
CREATE POLICY "Allow authenticated upload to verification"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification');

-- Policy untuk SELECT (admin only)
CREATE POLICY "Allow admin to view verification"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'verification');

-- Policy untuk DELETE
CREATE POLICY "Allow authenticated delete from verification"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'verification');
```
WITH CHECK (bucket_id = 'marketplace');

-- Policy untuk SELECT
CREATE POLICY "Allow public to view marketplace"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'marketplace');

-- Policy untuk DELETE
CREATE POLICY "Allow authenticated delete from marketplace"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'marketplace');
```

## 🚀 Running the Server

### Local Development

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server akan berjalan di: **http://localhost:3000**

## 📚 API Documentation

API documentation tersedia di: **http://localhost:3000/api-docs**

## 🔐 Authentication Flow

### 1. Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "nama": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "nomor_telefon": "081234567890",
  "role": "warga"
}
```

**Roles:** `adminSistem`, `ketuaRT`, `ketuaRW`, `bendahara`, `sekretaris`, `warga`

### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response akan berisi JWT token yang harus disimpan.

### 3. Authenticated Requests
Gunakan token di header:
```http
Authorization: Bearer <your-jwt-token>
```

## 📊 Data Flow

### Hierarchy Data
```
Rumah
  └─ Keluarga
       ├─ Kepala Keluarga (FK ke Warga.nik)
       └─ Warga (multiple, dengan userId 1-to-1)
```

### Flow Input Data

**Cara 1: Self-Registration (Warga bikin profil sendiri)**

1. **Register User** dengan role 'warga'
2. **Self-Register Warga Profile** → `POST /api/warga/self-register`
   - Upload foto KTP
   - Input NIK, nama, jenis kelamin, dll
   - Status: pending verification
3. **Admin approve** → Profile warga otomatis dibuat dengan userId link
4. **Warga bisa update data** (kecuali NIK/nama yang perlu verifikasi)

**Cara 2: Admin Create (Admin yang bikin profil warga)**

1. **Register User** dengan role yang sesuai
2. **Buat Rumah** (oleh adminSistem/ketuaRT/ketuaRW)
3. **Admin buat Warga** → `POST /api/warga` dengan NIK unik
4. **Buat Keluarga** dengan referensi:
   - `rumahId` → dari Rumah
   - `kepala_Keluarga_Id` → dari Warga.nik
5. **Update Warga** untuk set `keluargaId` dan `userId`

## 👤 Self-Registration Flow (Warga Create Profile)

### Submit Profile Registration

**Endpoint:** `POST /api/warga/self-register`

**Constraints:**
- ✅ Setiap user hanya bisa punya **1 profil warga** (1-to-1 mapping userId)
- ✅ Wajib upload **foto KTP** untuk verifikasi
- ✅ NIK harus unique dan 16 digit
- ⏳ Status awal: **pending** (tunggu admin approval)

**Request:**
```http
POST /api/warga/self-register
Authorization: Bearer <warga-token>
Content-Type: multipart/form-data

nik: "3201234567890001"
namaWarga: "Budi Santoso"
jenisKelamin: "Laki-laki"
statusDomisili: "Tetap"
statusHidup: "Hidup"
keluargaId: 1
foto_ktp: <file>
```

**Response (201):**
```json
{
  "success": true,
  "message": "Profile registration submitted for verification. Admin will review your KTP.",
  "data": {
    "verification_id": 1,
    "nik": "3201234567890001",
    "namaWarga": "Budi Santoso",
    "status": "pending",
    "foto_ktp": "https://...supabase.co/storage/v1/object/public/verification/ktp-...",
    "note": "Your profile will be created after admin approval"
  }
}
```

**Error (409 - Already has profile):**
```json
{
  "success": false,
  "message": "You already have a warga profile. Each user can only have one profile.",
  "data": {
    "nik": "3201234567890001",
    "namaWarga": "Budi Santoso",
    "userId": 5
  }
}
```

### Admin Approve Profile

**Endpoint:** `PUT /api/verification-warga/approve/:id`

Saat admin approve, sistem akan:
1. ✅ Detect ini new registration (bukan update)
2. ✅ Buat data warga baru dengan semua field dari verification
3. ✅ Link `userId` ke profil warga
4. ✅ Update status verification ke 'accepted'

**Response:**
```json
{
  "success": true,
  "message": "New warga profile created successfully",
  "data": {
    "id": 1,
    "status": "accepted",
    "verified_by": 1,
    "verified_at": "2025-11-21T11:00:00.000Z"
  },
  "warga": {
    "nik": "3201234567890001",
    "namaWarga": "Budi Santoso",
    "jenisKelamin": "Laki-laki",
    "statusDomisili": "Tetap",
    "statusHidup": "Hidup",
    "userId": 5,
    "keluargaId": 1
  }
}
```

## 🏪 MarketPlace Flow dengan AI Validation

### Upload Produk
```http
POST /api/marketplace
Authorization: Bearer <token>
Content-Type: multipart/form-data

gambar: <file>
namaProduk: "Sepatu Nike"
harga: 500000
deskripsi: "Sepatu olahraga kondisi baik"
```

### Validation Flow:
1. **User upload gambar + data produk**
2. **Backend mengirim gambar ke AI API** (`http://virtualtech.icu:3000/predict`)
3. **AI melakukan analisis kebersihan**
   - Jika `predicted_label === "bersih"` → Lanjut
   - Jika `predicted_label === "kotor"` → Ditolak
4. **Upload gambar ke Supabase Storage** (bucket: marketplace)
5. **Simpan data produk ke database** dengan URL gambar

### Response Success (201)
```json
{
  "success": true,
  "message": "Marketplace item created successfully",
  "data": {
    "id": 1,
    "namaProduk": "Sepatu Nike",
    "harga": 500000,
    "deskripsi": "Sepatu olahraga kondisi baik",
    "gambar": "https://...supabase.co/storage/v1/object/public/marketplace/..."
  },
  "validationResult": {
    "predicted_label": "bersih",
    "confidence": 0.95
  }
}
```

### Response Rejected (400)
```json
{
  "success": false,
  "message": "Image rejected: Product appears to be dirty or unclean",
  "validationResult": {
    "predicted_label": "kotor"
  }
}
```

## 🔒 Role-Based Access Control

### Public Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`

### Authenticated (All Roles)
- `GET /api/auth/profile`
- `GET /api/keluarga`
- `GET /api/keluarga/:id`
- `GET /api/warga`
- `GET /api/warga/:nik`
- `GET /api/rumah`
- `GET /api/rumah/:id`
- `GET /api/marketplace`
- `GET /api/marketplace/:id`

### Admin Only (adminSistem, ketuaRT, ketuaRW)
- `POST /api/keluarga`
- `PUT /api/keluarga/:id`
- `DELETE /api/keluarga/:id`
- `POST /api/warga`
- `DELETE /api/warga/:nik`
- `POST /api/rumah`
- `PUT /api/rumah/:id`
- `DELETE /api/rumah/:id`
- `GET /api/verification-warga/all`
- `GET /api/verification-warga/pending`
- `PUT /api/verification-warga/approve/:id`
- `PUT /api/verification-warga/reject/:id`

### Warga Update (Special Authorization)
- `PUT /api/warga/:nik` - Admin OR warga itu sendiri
  - **Admin**: Dapat update semua field
  - **Warga**: Dapat update field selain NIK dan namaWarga
  - **NIK/namaWarga changes**: Harus melalui verifikasi

### Marketplace (All Authenticated)
- `POST /api/marketplace` (upload produk)
- `PUT /api/marketplace/:id`
- `DELETE /api/marketplace/:id`

### Verification Warga (Authenticated)
- `POST /api/verification-warga/submit` - Submit request perubahan NIK/nama (warga)
- `GET /api/verification-warga/my-requests` - Get requests milik user (warga)

## 🔄 Verification System untuk NIK dan Nama Warga

Sistem verifikasi digunakan ketika warga ingin mengubah data **NIK** atau **namaWarga** mereka.

### Flow Verifikasi

```
1. Warga submit request → POST /api/verification-warga/submit
   ├─ Upload foto KTP
   ├─ Masukkan NIK baru (opsional)
   ├─ Masukkan nama baru (opsional)
   └─ Status: pending

2. Admin review request → GET /api/verification-warga/pending
   ├─ Lihat foto KTP
   ├─ Cek data NIK/nama baru
   └─ Validasi keaslian

3. Admin keputusan
   ├─ Approve → PUT /api/verification-warga/approve/:id
   │    ├─ Update data warga di database
   │    ├─ Status: accepted
   │    └─ Warga mendapat notifikasi sukses
   │
   └─ Reject → PUT /api/verification-warga/reject/:id
        ├─ Status: rejected
        └─ Warga mendapat alasan penolakan
```

### Submit Verification Request

**Endpoint:** `POST /api/verification-warga/submit`

**Request:**
```http
POST /api/verification-warga/submit
Authorization: Bearer <token>
Content-Type: multipart/form-data

foto_ktp: <file>
nik_baru: "3201234567890123"
namaWarga_baru: "Budi Santoso"
```

**Response:**
```json
{
  "success": true,
  "message": "Verification request submitted successfully",
  "data": {
    "id": 1,
    "warga_id": "3201234567890001",
    "user_id": 5,
    "nik_baru": "3201234567890123",
    "namaWarga_baru": "Budi Santoso",
    "foto_ktp": "https://...supabase.co/storage/v1/object/public/verification/ktp-...",
    "status": "pending"
  }
}
```

### Update Warga (PUT /api/warga/:nik)

Endpoint update dengan aturan berbeda untuk admin dan warga.

#### **NON-ADMIN (Role: warga)**

**Authorization:**
- ✅ NIK + userId harus match
- ❌ Tidak bisa update profil warga lain

**Update Rules:**

1. **Update NAMA (namaWarga)**
   - ❌ TIDAK bisa langsung update
   - ✅ Harus upload KTP baru
   - ✅ Masuk verification system
   - ⏳ Tunggu admin approval

**Request (Multipart Form-Data):**
```http
PUT /api/warga/3201234567890123
Authorization: Bearer <warga-token>
Content-Type: multipart/form-data

namaWarga: "Budi Santoso Wijaya"
foto_ktp: <file-ktp-baru>
```

**Response:**
```json
{
  "success": true,
  "message": "Nama change request submitted for verification.",
  "verification": {
    "nik": "3201234567890123",
    "namaWarga_baru": "Budi Santoso Wijaya",
    "foto_ktp": "https://...storage/ktp-update-123.jpg",
    "status": "pending"
  }
}
```

2. **Update FIELD LAIN (jenisKelamin, statusDomisili, statusHidup, keluargaId)**
   - ✅ Langsung terupdate
   - ❌ TIDAK perlu KTP
   - ❌ TIDAK perlu approval
   - ⚡ Instant update

**Request (JSON):**
```http
PUT /api/warga/3201234567890123
Authorization: Bearer <warga-token>
Content-Type: application/json

{
  "jenisKelamin": "Laki-laki",
  "statusDomisili": "Kontrak",
  "statusHidup": "Hidup",
  "keluargaId": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Warga updated successfully",
  "data": {
    "nik": "3201234567890123",
    "namaWarga": "Budi Santoso",
    "jenisKelamin": "Laki-laki",
    "statusDomisili": "Kontrak",
    "statusHidup": "Hidup",
    "keluargaId": 1,
    "userId": 5,
    "status": "accepted"
  }
}
```

3. **Update NAMA + FIELD LAIN (Combined)**
   - ✅ Harus upload KTP
   - ⏳ Semua perubahan masuk verification
   - ⏳ Field lain diupdate saat admin approve

**Request (Multipart Form-Data):**
```http
PUT /api/warga/3201234567890123
Authorization: Bearer <warga-token>
Content-Type: multipart/form-data

namaWarga: "Budi Santoso Wijaya"
jenisKelamin: "Laki-laki"
statusDomisili: "Kontrak"
foto_ktp: <file-ktp>
```

**Response:**
```json
{
  "success": true,
  "message": "Nama change request submitted for verification. Other field updates will be processed after admin approval.",
  "verification": {
    "nik": "3201234567890123",
    "namaWarga_baru": "Budi Santoso Wijaya",
    "foto_ktp": "https://...storage/ktp-update-123.jpg",
    "status": "pending"
  }
}
```

#### **ADMIN (Role: adminSistem, ketuaRT, ketuaRW)**

- ✅ Update semua field langsung
- ❌ TIDAK perlu KTP
- ❌ TIDAK perlu verification
- ⚡ Instant update

**Request (JSON):**
```http
PUT /api/warga/3201234567890123
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "namaWarga": "Budi Santoso Wijaya",
  "jenisKelamin": "Laki-laki",
  "statusDomisili": "Kontrak"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Warga updated successfully",
  "data": { ... }
}
```

#### **Error Cases**

**1. Pending Verification Exists:**
```json
{
  "success": false,
  "message": "You already have a pending verification request. Please wait for admin approval or rejection before submitting a new request.",
  "verification": {
    "id": 123,
    "nik": "3201234567890123",
    "status": "pending",
    "created_at": "2025-11-21T10:00:00Z"
  }
}
```

**2. Unauthorized (NIK + userId tidak match):**
```json
{
  "success": false,
  "message": "You are not authorized to update this warga profile. NIK and userId must match."
}
```

**3. Missing KTP when updating nama:**
```json
{
  "success": false,
  "message": "foto_ktp is required when updating namaWarga. Please upload your KTP image."
}
```

### Admin Approve Request

**Endpoint:** `PUT /api/verification-warga/approve/:id`

**Response:**
```json
{
  "success": true,
  "message": "Verification request approved successfully",
  "data": {
    "id": 1,
    "status": "accepted",
    "verified_by": 1,
    "verified_at": "2025-11-21T10:30:00.000Z"
  }
}
```

## 📝 API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get profile user (protected)

### Keluarga
- `GET /api/keluarga` - Get semua keluarga
- `GET /api/keluarga/:id` - Get keluarga by ID
- `POST /api/keluarga` - Create keluarga (admin only)
- `PUT /api/keluarga/:id` - Update keluarga (admin only)
- `DELETE /api/keluarga/:id` - Delete keluarga (admin only)

### Warga
- `GET /api/warga` - Get semua warga
- `GET /api/warga/:nik` - Get warga by NIK
- `POST /api/warga/self-register` - **Self-register profil warga** (warga, 1x per user, perlu KTP & admin approval)
- `POST /api/warga` - Create warga (admin only)
- `PUT /api/warga/:nik` - Update warga (admin OR warga sendiri, NIK/nama perlu verifikasi)
- `DELETE /api/warga/:nik` - Delete warga (admin only)

### Verification Warga
- `POST /api/verification-warga/submit` - Submit request perubahan NIK/nama (existing profile)
- `GET /api/verification-warga/my-requests` - Get request verifikasi milik user
- `GET /api/verification-warga/all` - Get semua request (admin only)
- `GET /api/verification-warga/pending` - Get pending requests (admin only)
- `PUT /api/verification-warga/approve/:id` - Approve request (admin only, auto-create profile jika new registration)
- `PUT /api/verification-warga/reject/:id` - Reject request (admin only)

### Rumah
- `GET /api/rumah` - Get semua rumah
- `GET /api/rumah/:id` - Get rumah by ID
- `POST /api/rumah` - Create rumah (admin only)
- `PUT /api/rumah/:id` - Update rumah (admin only)
- `DELETE /api/rumah/:id` - Delete rumah (admin only)

### MarketPlace
- `GET /api/marketplace` - Get semua produk
- `GET /api/marketplace/:id` - Get produk by ID
- `POST /api/marketplace` - Upload produk dengan validasi AI
- `PUT /api/marketplace/:id` - Update produk
- `DELETE /api/marketplace/:id` - Delete produk

## 🧪 Testing dengan Postman

1. **Import collection** dari Swagger: `http://localhost:3000/api-docs`
2. **Register** user baru
3. **Login** dan simpan token
4. **Set Authorization** → Bearer Token
5. **Test endpoints** sesuai role

## 🛡️ Security Features

- ✅ Password hashing dengan bcryptjs
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Input validation
- ✅ File upload validation (size & mime type)
- ✅ AI-based image validation
- ✅ Supabase Row Level Security (RLS)

## 📦 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Authentication:** JWT
- **Password Hashing:** bcryptjs
- **File Upload:** Multer
- **HTTP Client:** Axios
- **Documentation:** Swagger (OpenAPI 3.0)
- **AI Integration:** External API for image validation


### Production Deployment

1. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with production values
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

ISC

## 👥 Authors

Backend Jawara Team

## 📞 Support

Untuk pertanyaan atau bantuan, silakan buka issue di repository ini.

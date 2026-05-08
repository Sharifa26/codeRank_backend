# 📡 CodeRank API Documentation

Base URL:

```text
http://localhost:5000/api/v1
```

---

# 🔐 Authentication APIs

## 1. Sign Up

### Endpoint

```http
POST /auth/signup
```

### cURL Request

```bash
curl --location 'http://localhost:5000/api/v1/auth/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
    "username":"sharif",
    "email":"sharifasheriff265@gmail.com",
    "password":"123456789",
    "confirmPassword":"123456789"
}'
```

### Response

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "69f87a502259e62a8237f449",
      "username": "sharif",
      "email": "sharifasheriff265@gmail.com",
      "createdAt": "2026-05-04T10:52:00.465Z"
    }
  }
}
```

---

## 2. Login

### Endpoint

```http
POST /auth/login
```

### cURL Request

```bash
curl --location 'http://localhost:5000/api/v1/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email":"sharifasheriff26@gmail.com",
    "password":"newpass123"
}'
```

### Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "69e6d8ffc85e58a23c140fc9",
      "username": "sharifa",
      "email": "sharifa@gmail.com"
    },
    "token": "YOUR_JWT_TOKEN"
  }
}
```

---

## 3. Get Current User

### Endpoint

```http
GET /auth/me
```

### cURL Request

```bash
curl --location 'http://localhost:5000/api/v1/auth/me' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Response

```json
{
  "success": true,
  "message": "User details retrieved",
  "data": {
    "user": {
      "id": "69e7b157b1b6f3992b19e6aa",
      "username": "shari",
      "email": "sharifasheriff26@gmail.com",
      "createdAt": "2026-04-21T17:18:15.237Z"
    }
  }
}
```

---

## 4. Forgot Password

### Endpoint

```http
POST /auth/forgot-password
```

### cURL Request

```bash
curl --location 'http://localhost:5000/api/v1/auth/forgot-password' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email":"sharifasheriff26@gmail.com"
}'
```

### Response

```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent."
}
```

---

## 5. Reset Password

### Endpoint

```http
POST /auth/reset-password
```

### cURL Request

```bash
curl --location 'http://localhost:5000/api/v1/auth/reset-password' \
--header 'Content-Type: application/json' \
--data '{
    "token": "RESET_TOKEN",
    "newPassword": "newpass123"
}'
```

### Response

```json
{
  "success": true,
  "message": "Password reset successful. Please login."
}
```

---

# 💾 Code APIs

## 6. Get Code History

### Endpoint

```http
GET /code/history
```

### cURL Request

```bash
curl --location 'http://localhost:5000/api/v1/code/history' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Response

```json
{
  "success": true,
  "message": "History retrieved successfully",
  "data": {
    "snippets": [],
    "total": 0,
    "page": 1,
    "totalPages": 0
  }
}
```

---

## 7. Share Code

### Endpoint

```http
POST /code/share
```

### cURL Request

```bash
curl --location 'http://localhost:5000/api/v1/code/share' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
    "codeId":"69e7084537653401a3074787"
}'
```

### Response

```json
{
  "success": true,
  "message": "Share link generated successfully",
  "data": {
    "shareId": "76fa31c7",
    "shareUrl": "/api/v1/code/shared/76fa31c7"
  }
}
```

---

## 8. Get Code By ID

### Endpoint

```http
GET /code/:id
```

### cURL Request

```bash
curl --location 'http://localhost:5000/api/v1/code/69e7084537653401a3074787' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Response

```json
{
  "success": true,
  "message": "Code snippet retrieved successfully",
  "data": {
    "snippet": {
      "_id": "69e7084537653401a3074787",
      "title": "print program",
      "language": "go",
      "code": "package main\nimport \"fmt\"\nfunc main(){ fmt.Println(8+28) }",
      "status": "pending",
      "isPublic": true
    }
  }
}
```

---

## 9. Get Shared Code

### Endpoint

```http
GET /code/shared/:shareId
```

### cURL Request

```bash
curl --location 'http://localhost:5000/api/v1/code/shared/76fa31c7'
```

### Response

```json
{
  "success": true,
  "message": "Shared code retrieved successfully",
  "data": {
    "snippet": {
      "_id": "69e7084537653401a3074787",
      "title": "print program",
      "language": "go",
      "code": "package main\nimport \"fmt\"\nfunc main(){ fmt.Println(8+28) }"
    }
  }
}
```

---

## 10. AI Code Optimizer

### Endpoint

```http
POST /code/optimize
```

### cURL Request

```bash
curl --location 'http://localhost:5000/api/v1/code/optimize' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
  "language": "javascript",
  "code": "function sum(n){ if(n == 0) return 0; return n+sum(n-1); } console.log(sum(5));"
}'
```

### Response

```json
{
  "success": true,
  "message": "Code optimization complete",
  "data": {
    "optimizedCode": "Optimized code here...",
    "suggestions": [
      "Replace recursion with iteration",
      "Add proper input validation"
    ],
    "improvements": [
      "Reduced time complexity",
      "Improved performance"
    ]
  }
}
```

---

# ✅ Notes

- Replace `YOUR_JWT_TOKEN` with the token received after login.
- All protected routes require the `Authorization` header.
- Responses follow a structured JSON format.
- API version: `v1`

---
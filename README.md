# Complete API Endpoints for Postman Testing

## Base URL
```
http://localhost:3000
```

## Authentication Headers
- **Tourist Requests**: `Authorization: Bearer {JWT_TOKEN}`
- **Admin Requests**: `Authorization: Bearer {ADMIN_JWT_TOKEN}`

---

## 🔐 AUTHENTICATION ENDPOINTS

### 1. Register Tourist
- **Method**: POST
- **URL**: `/api/v1/auth/register`
- **Auth**: None
- **Body**:
```json
{
  "email": "tourist@example.com",
  "password": "password123",
  "phoneNumber": "+1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "nationality": "US"
}
```

### 2. Login Tourist
- **Method**: POST
- **URL**: `/api/v1/auth/login`
- **Auth**: None
- **Body**:
```json
{
  "email": "tourist@example.com",
  "password": "password123"
}
```

### 3. Verify OTP
- **Method**: POST
- **URL**: `/api/v1/auth/verify-otp`
- **Auth**: None
- **Body**:
```json
{
  "email": "tourist@example.com",
  "otp": "123456"
}
```

### 4. Register Admin (Secure)
- **Method**: POST
- **URL**: `/api/v1/admin/register`
- **Auth**: None
- **Body**:
```json
{
  "adminCode": "ADMIN123",
  "email": "admin@example.com",
  "password": "admin123",
  "firstName": "Admin",
  "lastName": "User",
  "department": "Security",
  "badgeNumber": "SEC-001"
}
```

### 5. Login Admin
- **Method**: POST
- **URL**: `/api/v1/admin/login`
- **Auth**: None
- **Body**:
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

---

## 👤 USER MANAGEMENT ENDPOINTS (Tourist)

### 6. Get User Profile
- **Method**: GET
- **URL**: `/api/v1/user/profile`
- **Auth**: Tourist Token

### 7. Update User Profile
- **Method**: POST
- **URL**: `/api/v1/user/profile`
- **Auth**: Tourist Token
- **Body**:
```json
{
  "kycDetails": {
    "documentType": "passport",
    "documentNumber": "AB1234567"
  },
  "tripItineraries": [
    {
      "destination": "Guwahati, Assam",
      "startDate": "2023-10-01",
      "endDate": "2023-10-07",
      "accommodation": "Hotel Brahmaputra",
      "activities": ["Sightseeing", "River cruise"]
    }
  ]
}
```

### 8. Get Current Trip
- **Method**: GET
- **URL**: `/api/v1/user/current-trip`
- **Auth**: Tourist Token

### 9. Update Emergency Contacts
- **Method**: POST
- **URL**: `/api/v1/user/emergency-contacts`
- **Auth**: Tourist Token
- **Body**:
```json
{
  "contacts": [
    {
      "name": "Emergency Contact 1",
      "phone": "+11234567890",
      "email": "emergency1@example.com",
      "relationship": "Family"
    }
  ]
}
```

### 10. Get Emergency Contacts
- **Method**: GET
- **URL**: `/api/v1/user/emergency-contacts`
- **Auth**: Tourist Token

### 11. Update User Settings
- **Method**: POST
- **URL**: `/api/v1/user/settings`
- **Auth**: Tourist Token
- **Body**:
```json
{
  "settings": {
    "trackingEnabled": true,
    "notificationsEnabled": true,
    "language": "en",
    "emergencyAlertContacts": true
  }
}
```

---

## 📍 LOCATION SERVICES ENDPOINTS

### 12. Record Location Ping
- **Method**: POST
- **URL**: `/api/v1/location/ping`
- **Auth**: Tourist Token
- **Body**:
```json
{
  "latitude": 26.1445,
  "longitude": 91.7362,
  "accuracy": 10,
  "altitude": 55,
  "speed": 0
}
```

### 13. Get Location History
- **Method**: GET
- **URL**: `/api/v1/location/history?startDate=2023-10-01&endDate=2023-10-07`
- **Auth**: Tourist Token

### 14. Check Zone (Public)
- **Method**: GET
- **URL**: `/api/v1/location/check?lat=26.1445&lng=91.7362`
- **Auth**: None

---

## 🚨 ALERT SYSTEM ENDPOINTS

### 15. Trigger Panic Alert
- **Method**: POST
- **URL**: `/api/v1/alerts/panic`
- **Auth**: Tourist Token
- **Body**:
```json
{
  "coordinates": {
    "latitude": 26.1445,
    "longitude": 91.7362
  },
  "message": "Need help immediately!",
  "mediaUrls": []
}
```

### 16. Get Alert Summary
- **Method**: GET
- **URL**: `/api/v1/alerts/tourist-summary`
- **Auth**: Tourist Token

### 17. Get Alert History
- **Method**: GET
- **URL**: `/api/v1/alerts/history?limit=20&page=1`
- **Auth**: Tourist Token

### 18. Get Safety Score (Mock AI)
- **Method**: GET
- **URL**: `/api/v1/ai/safety-score`
- **Auth**: Tourist Token

---

## ⚡ AI SERVICE ENDPOINTS (Admin Only)

### 19. Calculate Safety Score (AI)
- **Method**: POST
- **URL**: `/api/v1/ai-service/safety-score`
- **Auth**: Admin Token
- **Body**:
```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "locationData": [
    {
      "latitude": 26.1445,
      "longitude": 91.7362,
      "timestamp": "2023-10-05T10:30:00Z",
      "accuracy": 10
    }
  ],
  "historicalAlerts": [],
  "timeOfDay": "morning",
  "dayOfWeek": "weekday"
}
```

### 20. Detect Anomalies (AI)
- **Method**: POST
- **URL**: `/api/v1/ai-service/anomaly-detection`
- **Auth**: Admin Token
- **Body**:
```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "currentLocation": {
    "latitude": 26.1445,
    "longitude": 91.7362,
    "timestamp": "2023-10-05T10:30:00Z"
  },
  "recentLocations": [
    {
      "latitude": 26.1440,
      "longitude": 91.7350,
      "timestamp": "2023-10-05T10:25:00Z"
    }
  ],
  "movementPattern": {
    "averageSpeed": 1.2,
    "direction": 45,
    "stability": 0.8
  }
}
```

### 21. Generate Predictive Alerts (AI)
- **Method**: POST
- **URL**: `/api/v1/ai-service/predictive-alerts`
- **Auth**: Admin Token
- **Body**:
```json
{
  "location": {
    "latitude": 26.1445,
    "longitude": 91.7362
  },
  "timeOfDay": "night",
  "dayOfWeek": "weekend",
  "historicalData": [
    {
      "alertCount": 3,
      "riskLevel": "high",
      "timestamp": "2023-10-04T22:30:00Z"
    }
  ]
}
```

### 22. Analyze Behavior (AI)
- **Method**: POST
- **URL**: `/api/v1/ai-service/behavior-analysis`
- **Auth**: Admin Token
- **Body**:
```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "locations": [],
  "alerts": [],
  "interactions": [],
  "timeFrame": {
    "start": "2023-10-01T00:00:00Z",
    "end": "2023-10-05T23:59:59Z"
  }
}
```

---

## 🏢 ADMIN DASHBOARD ENDPOINTS

### 23. Get Dashboard Statistics
- **Method**: GET
- **URL**: `/api/v1/admin/dashboard/stats`
- **Auth**: Admin Token

### 24. Get Heatmap Data
- **Method**: GET
- **URL**: `/api/v1/admin/dashboard/heatmap?type=density&startDate=2023-10-01&endDate=2023-10-05`
- **Auth**: Admin Token

### 25. Get Tourists List
- **Method**: GET
- **URL**: `/api/v1/admin/tourists?page=1&limit=20&search=john`
- **Auth**: Admin Token

### 26. Get Audit Logs
- **Method**: GET
- **URL**: `/api/v1/admin/audit-logs?page=1&limit=50&adminId=64f1a2b3c4d5e6f7a8b9c0d1`
- **Auth**: Admin Token

---

## 📱 MEDIA MANAGEMENT ENDPOINTS

### 27. Upload Media File
- **Method**: POST
- **URL**: `/api/v1/media/upload`
- **Auth**: Tourist Token
- **Body**: Form-data
  - Key: `media` (File)
  - Key: `alertId` (optional, String)

### 28. Get Media File
- **Method**: GET
- **URL**: `/api/v1/media/:filename`
- **Auth**: None

### 29. Delete Media File
- **Method**: DELETE
- **URL**: `/api/v1/media/:filename`
- **Auth**: Tourist Token

---

## 🔔 NOTIFICATION ENDPOINTS

### 30. Get Notifications
- **Method**: GET
- **URL**: `/api/v1/notifications?limit=20&page=1`
- **Auth**: Tourist Token

### 31. Mark Notification as Read
- **Method**: POST
- **URL**: `/api/v1/notifications/:id/read`
- **Auth**: Tourist Token

### 32. Mark All Notifications as Read
- **Method**: POST
- **URL**: `/api/v1/notifications/read-all`
- **Auth**: Tourist Token

---

## 📋 CONSENT MANAGEMENT ENDPOINTS

### 33. Get Consent History
- **Method**: GET
- **URL**: `/api/v1/consent/history`
- **Auth**: Tourist Token

### 34. Record Consent
- **Method**: POST
- **URL**: `/api/v1/consent/record`
- **Auth**: Tourist Token
- **Body**:
```json
{
  "type": "tracking",
  "granted": true,
  "purpose": "Location tracking for safety",
  "version": "1.0"
}
```

### 35. Revoke Consent
- **Method**: POST
- **URL**: `/api/v1/consent/revoke`
- **Auth**: Tourist Token
- **Body**:
```json
{
  "type": "tracking",
  "purpose": "Location tracking for safety",
  "version": "1.0"
}
```

---

## ⚡ BLOCKCHAIN (MOCK) ENDPOINTS

### 36. Issue Digital ID (Mock)
- **Method**: POST
- **URL**: `/api/v1/blockchain/issue-id`
- **Auth**: None
- **Body**:
```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "idData": "{\"userId\":\"64f1a2b3c4d5e6f7a8b9c0d1\",\"type\":\"tourist-id\"}",
  "expiryDate": "2023-12-31T23:59:59Z"
}
```

### 37. Get QR Code
- **Method**: GET
- **URL**: `/api/v1/blockchain/qr/:id`
- **Auth**: None

### 38. Verify QR Code
- **Method**: POST
- **URL**: `/api/v1/blockchain/verify`
- **Auth**: None
- **Body**:
```json
{
  "qrData": "base64-encoded-qr-data"
}
```

---

## 📴 OFFLINE SUPPORT ENDPOINTS

### 39. Get Offline Status
- **Method**: GET
- **URL**: `/api/v1/offline/status`
- **Auth**: Tourist Token

### 40. Process Offline Requests (Admin)
- **Method**: POST
- **URL**: `/api/v1/offline/process`
- **Auth**: None

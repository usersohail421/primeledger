# SiteLedger - Backend API

This is the Spring Boot-based backend for the **SiteLedger** project. It provides a RESTful API for project management, expense tracking, and financial analytics.

## 🚀 Features

- **Project Management API**: Full CRUD operations for construction site projects.
- **Ledger & Billing System**: Complex bill/item relationships with sequential serial tracking.
- **Reporting Engine**: 
  - Automated **PDF generation** for site bills.
  - **Excel export** for project expense summaries.
- **Analytics Service**: Dedicated endpoints for calculating weekly trends and top expense categories.
- **Secure Authentication**: JWT-based security with password hashing (BCrypt).
- **Interactive Documentation**: Integrated Swagger/OpenAPI support.

## 🛠️ Tech Stack

- **Framework**: Spring Boot 3.2+
- **Security**: Spring Security + JWT
- **Persistence**: Spring Data JPA / Hibernate
- **Database**: MySQL 8.0
- **Build Tool**: Maven
- **Lombok**: For boilerplate-free code
- **Documentation**: SpringDoc OpenAPI UI

## 📦 Getting Started

### 1. Database Configuration
Ensure MySQL is running and create the database:
```sql
CREATE DATABASE siteledger;
```

### 2. Configure Credentials
Update `src/main/resources/application.properties`:
```properties
spring.datasource.username=your_root
spring.datasource.password=your_password
server.port=7887
```

### 3. Run the Application
```bash
mvn spring-boot:run
```

## 📡 API Reference

Once started, access the documentation at:
- **Swagger UI**: `http://localhost:7887/swagger-ui.html`
- **API Docs**: `http://localhost:7887/api-docs`

---

*For full project documentation including frontend setup, please refer to the [Root README](../README.md).*

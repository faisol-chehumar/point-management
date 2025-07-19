# Quick Start Guide: Credit Logging and Audit System

## 🚀 **For Gemini AI Implementation**

### **Priority Order for Implementation:**

1. **START HERE** → Database Schema Enhancement (Task 1.1, 1.2)
2. **NEXT** → Audit Service Layer (Task 2.1, 2.2) 
3. **THEN** → API Enhancements (Task 3.1, 3.2)
4. **AFTER** → Admin Interface (Task 4.1, 4.2)
5. **FINALLY** → Analytics & Data Management (Tasks 5.x, 6.x)

---

## 🎯 **Immediate Action Items**

### **1. Database Migration (CRITICAL)**
```bash
# After updating schema.prisma
npx prisma db push
npx prisma generate
```

### **2. Key Files to Create/Modify:**

**Critical Files (Phase 1):**
- `prisma/schema.prisma` - Enhanced CreditLog + new AuditLog model
- `src/lib/audit-service.ts` - Core audit functionality
- `src/lib/credit-logger.ts` - Enhanced credit logging

**Important Files (Phase 2):**
- `src/app/api/admin/audit/route.ts` - Audit trail API
- `src/app/api/admin/integrity/route.ts` - System integrity API
- `src/components/admin/AuditDashboard.tsx` - Admin audit interface

---

## 🔧 **Implementation Shortcuts**

### **Database Schema Changes (Copy-Paste Ready):**

1. **Add to CreditLog model:**
```prisma
  sessionId         String?
  ipAddress         String?
  userAgent         String?
  source            CreditSource @default(MANUAL)
  batchId           String?
  previousBalance   Int?
  newBalance        Int?
  metadata          Json?
```

2. **Add new AuditLog model (complete):**
```prisma
model AuditLog {
  id          String      @id @default(cuid())
  action      AuditAction
  entityType  String
  entityId    String?
  adminId     String?
  sessionId   String?
  ipAddress   String?
  userAgent   String?
  details     Json?
  oldValues   Json?
  newValues   Json?
  success     Boolean     @default(true)
  errorMessage String?
  duration    Int?
  createdAt   DateTime    @default(now())
  
  admin       User?       @relation("AdminAuditLogs", fields: [adminId], references: [id])
  
  @@map("audit_logs")
  @@index([action, createdAt])
  @@index([adminId, createdAt])
}
```

---

## 📝 **Code Templates**

### **Audit Service Template:**
```typescript
export class AuditService {
  static async logAction(params: {
    action: AuditAction
    entityType: string
    entityId?: string
    adminId?: string
    details?: any
    context: { sessionId?: string; ipAddress?: string }
  }) {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        adminId: params.adminId,
        sessionId: params.context.sessionId,
        ipAddress: params.context.ipAddress,
        details: params.details,
        createdAt: new Date()
      }
    })
  }
}
```

### **Enhanced Credit Logger:**
```typescript
export class CreditLogger {
  static async logCreditChange(params: {
    userId: string
    amount: number
    previousBalance: number
    newBalance: number
    type: CreditLogType
    source: CreditSource
    adminId?: string
    reason?: string
    context: { sessionId?: string; ipAddress?: string }
  }) {
    return await prisma.creditLog.create({
      data: {
        userId: params.userId,
        amount: params.amount,
        type: params.type,
        source: params.source,
        previousBalance: params.previousBalance,
        newBalance: params.newBalance,
        reason: params.reason,
        adminId: params.adminId,
        sessionId: params.context.sessionId,
        ipAddress: params.context.ipAddress,
        createdAt: new Date()
      }
    })
  }
}
```

---

## 🎯 **Testing Checklist**

### **After Each Phase:**
- [ ] Database migrations run successfully
- [ ] All TypeScript compilation passes
- [ ] Basic functionality tests pass
- [ ] No performance regressions
- [ ] Audit logs are being created

### **Manual Testing Steps:**
1. **Credit Operations:** Verify audit logs created for credit adjustments
2. **Admin Actions:** Check audit logs for user status changes
3. **API Calls:** Test audit trail API endpoints
4. **UI Components:** Verify audit dashboard displays data
5. **Export:** Test audit log export functionality

---

## ⚡ **Performance Tips**

1. **Database Indexes:** Add indexes on frequently queried fields
2. **Pagination:** Always paginate audit log queries
3. **Background Jobs:** Use queues for heavy audit operations
4. **Caching:** Cache frequent audit queries
5. **Cleanup:** Implement audit log retention policies

---

## 🔒 **Security Reminders**

1. **Authentication:** All audit APIs require admin access
2. **Input Validation:** Validate all audit filter parameters
3. **Rate Limiting:** Implement rate limits on audit endpoints
4. **Data Sanitization:** Sanitize sensitive data in audit logs
5. **Access Control:** Log all audit log access attempts

---

## 📊 **Success Verification**

**After Phase 1 (Database):**
```sql
-- Verify new fields exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'credit_logs';

-- Check audit_logs table created
SELECT * FROM audit_logs LIMIT 1;
```

**After Phase 2 (Services):**
```typescript
// Test audit service
await AuditService.logAction({
  action: 'CREDIT_ADJUSTMENT',
  entityType: 'User',
  entityId: 'user123',
  adminId: 'admin123',
  context: { sessionId: 'session123' }
})
```

**After Phase 3 (APIs):**
```bash
# Test audit API
curl -H "Authorization: Bearer admin_token" \
     "http://localhost:3000/api/admin/audit?action=CREDIT_ADJUSTMENT"
```

---

## 🆘 **Common Issues & Solutions**

### **Database Migration Issues:**
- **Issue:** Migration fails due to existing data
- **Solution:** Create data migration script for existing records

### **Performance Issues:**
- **Issue:** Slow audit queries
- **Solution:** Add database indexes on frequently queried fields

### **Memory Issues:**
- **Issue:** Large audit exports crash server
- **Solution:** Implement streaming exports with pagination

### **TypeScript Errors:**
- **Issue:** Type errors after schema changes
- **Solution:** Run `npx prisma generate` and restart TypeScript server

---

## 🎯 **Final Implementation Note**

**Focus on getting Phase 1 and 2 working perfectly before moving to advanced features. A solid foundation with basic audit logging is better than incomplete advanced features.**

**Remember:** This audit system will handle sensitive data - always test thoroughly and follow security best practices!
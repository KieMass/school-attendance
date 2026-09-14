# Entity-Relationship Diagram

Generated from [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma).
To regenerate an interactive version, run `npx prisma generate` with the
[`prisma-erd-generator`](https://github.com/keonik/prisma-erd-generator)
plugin, or open the schema in Prisma's VS Code extension.

```mermaid
erDiagram
    USER ||--o| STUDENT : "has profile"
    USER ||--o| PARENT : "has profile"
    USER ||--o| SECURITY_OFFICER : "has profile"
    USER ||--o| STAFF : "has profile"
    USER ||--o| ADMIN : "has profile"
    USER ||--o{ REFRESH_TOKEN : issues
    USER ||--o{ DEVICE_TOKEN : registers
    USER ||--o{ AUDIT_LOG : performs
    USER ||--o{ NOTIFICATION : receives

    STUDENT ||--o{ LEAVE_REQUEST : submits
    STUDENT ||--o{ STUDENT_GUARDIAN : "linked to"
    PARENT ||--o{ STUDENT_GUARDIAN : "guardian of"
    STUDENT_GUARDIAN }o--|| STUDENT : ""
    STUDENT_GUARDIAN }o--|| PARENT : ""

    LEAVE_REQUEST ||--o{ LEAVE_APPROVAL : "decided by"
    PARENT ||--o{ LEAVE_APPROVAL : decides
    LEAVE_REQUEST ||--o{ QR_TOKEN : generates
    LEAVE_REQUEST ||--o| EXIT_LOG : "results in"
    LEAVE_REQUEST ||--o| RETURN_LOG : "results in"

    QR_TOKEN ||--o| EXIT_LOG : "consumed by"
    SECURITY_OFFICER ||--o{ EXIT_LOG : records
    SECURITY_OFFICER ||--o{ RETURN_LOG : records
    EXIT_LOG ||--o| RETURN_LOG : "closed by"
    STUDENT ||--o{ EXIT_LOG : ""
    STUDENT ||--o{ RETURN_LOG : ""

    USER {
        uuid id PK
        string email UK
        string phone UK
        string passwordHash
        enum role
        boolean isActive
    }
    STUDENT {
        uuid id PK
        uuid userId FK
        string studentIdCode UK
        string firstName
        string lastName
        string dormitory
    }
    PARENT {
        uuid id PK
        uuid userId FK
        string firstName
        string lastName
        string relationship
    }
    STUDENT_GUARDIAN {
        uuid id PK
        uuid studentId FK
        uuid parentId FK
        boolean isPrimary
        boolean canApprove
    }
    SECURITY_OFFICER {
        uuid id PK
        uuid userId FK
        string badgeNumber UK
        string postLocation
    }
    STAFF {
        uuid id PK
        uuid userId FK
        string department
    }
    ADMIN {
        uuid id PK
        uuid userId FK
    }
    LEAVE_REQUEST {
        uuid id PK
        uuid studentId FK
        enum leaveType
        string reason
        string destination
        datetime leaveDate
        datetime departureTime
        datetime expectedReturnTime
        enum status
    }
    LEAVE_APPROVAL {
        uuid id PK
        uuid leaveRequestId FK
        uuid parentId FK
        enum decision
        string comments
        datetime decidedAt
    }
    QR_TOKEN {
        uuid id PK
        uuid leaveRequestId FK
        string publicId UK
        string encryptedPayload
        string securityToken UK
        datetime expiresAt
        enum status
    }
    EXIT_LOG {
        uuid id PK
        uuid leaveRequestId FK
        uuid studentId FK
        uuid qrTokenId FK
        uuid securityOfficerId FK
        datetime exitAt
        enum status
    }
    RETURN_LOG {
        uuid id PK
        uuid leaveRequestId FK
        uuid exitLogId FK
        uuid securityOfficerId FK
        datetime returnAt
        boolean wasLate
        int minutesLate
    }
    NOTIFICATION {
        uuid id PK
        uuid userId FK
        enum type
        enum channel
        enum status
    }
    AUDIT_LOG {
        uuid id PK
        uuid userId FK
        enum action
        string entityType
        string entityId
        datetime createdAt
    }
    REFRESH_TOKEN {
        uuid id PK
        uuid userId FK
        string tokenHash UK
        datetime expiresAt
        datetime revokedAt
    }
    DEVICE_TOKEN {
        uuid id PK
        uuid userId FK
        string token UK
        string platform
    }
```

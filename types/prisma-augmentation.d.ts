import "@prisma/client";

declare module "@prisma/client" {
  interface PrismaClient {
    auditLog: any;
  }
}


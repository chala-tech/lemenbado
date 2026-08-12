import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';

interface SubmitDocumentInput {
  userId: string;
  type: string;
  fileUrl: string;
}

export async function submitDocument(input: SubmitDocumentInput) {
  return prisma.document.create({
    data: { userId: input.userId, type: input.type, fileUrl: input.fileUrl, status: 'PENDING' },
  });
}

export async function listPendingDocuments() {
  return prisma.document.findMany({
    where: { status: 'PENDING' },
    include: { user: { select: { id: true, name: true, phone: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function decideDocument(documentId: string, adminId: string, outcome: 'VERIFIED' | 'REJECTED') {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) throw new HttpError(404, 'Document not found');

  await prisma.document.update({ where: { id: documentId }, data: { status: outcome } });

  return prisma.verification.create({
    data: { documentId, verifiedById: adminId, outcome },
  });
}
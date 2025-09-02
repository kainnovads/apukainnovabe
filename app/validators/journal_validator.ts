import vine from '@vinejs/vine'

export const createJournalValidator = vine.compile(
  vine.object({
    journalNumber: vine.string().trim().minLength(1).maxLength(50),
    date: vine.date(),
    description: vine.string().trim().minLength(1).maxLength(500),
    status: vine.enum(['draft', 'posted', 'cancelled']),
    referenceType: vine.string().trim().optional(),
    referenceId: vine.string().trim().optional(),
    createdBy: vine.number().positive(),
    updatedBy: vine.number().positive(),
    journalLines: vine.array(
      vine.object({
        accountId: vine.string().trim().minLength(1),
        debit: vine.number().min(0),
        credit: vine.number().min(0),
        description: vine.string().trim().optional(),
      })
    ).minLength(2), // Minimal 2 line items (debit dan credit)
  })
)

export const updateJournalValidator = vine.compile(
  vine.object({
    journalNumber: vine.string().trim().minLength(1).maxLength(50).optional(),
    date: vine.date().optional(),
    description: vine.string().trim().minLength(1).maxLength(500).optional(),
    status: vine.enum(['draft', 'posted', 'cancelled']).optional(),
    referenceType: vine.string().trim().optional(),
    referenceId: vine.string().trim().optional(),
    updatedBy: vine.number().positive(),
    journalLines: vine.array(
      vine.object({
        accountId: vine.string().trim().minLength(1),
        debit: vine.number().min(0),
        credit: vine.number().min(0),
        description: vine.string().trim().optional(),
      })
    ).minLength(2).optional(),
  })
)

export const postJournalValidator = vine.compile(
  vine.object({
    updatedBy: vine.number().positive(),
  })
)

export const cancelJournalValidator = vine.compile(
  vine.object({
    updatedBy: vine.number().positive(),
  })
)

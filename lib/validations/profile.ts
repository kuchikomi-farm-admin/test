import { z } from "zod"

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "表示名を入力してください")
    .max(100),
  email: z.string().email().optional(),
  phone: z
    .string()
    .regex(/^[\d\-+()]*$/, "有効な電話番号を入力してください")
    .optional()
    .or(z.literal("")),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

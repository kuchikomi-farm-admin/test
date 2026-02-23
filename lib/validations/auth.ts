import { z } from "zod"

// ──────── パスワード複雑性ルール ────────
export const passwordSchema = z
  .string()
  .min(8, "パスワードは8文字以上で入力してください")
  .max(72, "パスワードは72文字以下で入力してください")
  .regex(/[a-zA-Z]/, "英字を1文字以上含めてください")
  .regex(/[0-9]/, "数字を1文字以上含めてください")

// ──────── メールアドレス ────────
export const emailSchema = z
  .string()
  .min(1, "メールアドレスを入力してください")
  .email("有効なメールアドレスを入力してください")
  .max(254, "メールアドレスが長すぎます")
  .transform((v) => v.toLowerCase().trim())

// ──────── 招待リンク ref コード ────────
export const refCodeSchema = z
  .string()
  .min(1, "招待リンクが無効です")
  .transform((v) => v.trim())

// ──────── サインアップ ────────
export const signUpSchema = z.object({
  lastName: z
    .string()
    .min(1, "姓を入力してください")
    .max(50, "姓は50文字以下で入力してください"),
  firstName: z
    .string()
    .min(1, "名を入力してください")
    .max(50, "名は50文字以下で入力してください"),
  email: emailSchema,
  password: passwordSchema,
  question: z
    .string()
    .min(10, "審査項目は10文字以上で入力してください")
    .max(1000, "審査項目は1000文字以下で入力してください"),
  ref: refCodeSchema,
})

export type SignUpInput = z.infer<typeof signUpSchema>

// ──────── ログイン ────────
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "パスワードを入力してください"),
})

export type SignInInput = z.infer<typeof signInSchema>

// ──────── パスワード変更 ────────
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "確認用パスワードを入力してください"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "新しいパスワードが一致しません",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "現在のパスワードと異なるパスワードを設定してください",
    path: ["newPassword"],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

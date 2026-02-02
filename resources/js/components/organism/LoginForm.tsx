import InputField from "@/components/molecules/InputField"

export default function LoginForm() {
  return (
    <div className="space-y-4">
      <InputField
        label="Email"
        name="email"
        type="email"
        placeholder="email@example.com"
      />

      <InputField
        label="Password"
        name="password"
        type="password"
        error="Password salah"
      />
    </div>
  )
}

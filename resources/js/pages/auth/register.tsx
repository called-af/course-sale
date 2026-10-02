import RegisterForm from "@/components/organisms/RegisterForm"
import Title from "@/components/atoms/Title"
import { Head } from "@inertiajs/react"
import LoginLayout from "@/components/templates/LoginLayout"

export default function Login() {
  return (
    <LoginLayout>
    <Head title="Sign Up"/>
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-slate-900">
      <div
        className="hidden md:block bg-cover bg-center"
        style={{
          backgroundImage: "url('/assets/landscape.jpeg')",
        }}
      />
      <div className="flex items-center justify-center px-6">
        <div className="w-full max-w-md space-y-5">
          <Title as="h2">Sign Up to get access</Title>
          <RegisterForm />
        </div>
      </div>
    </div>
    </LoginLayout>
  )
}

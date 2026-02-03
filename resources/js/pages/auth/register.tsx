import RegisterForm from "@/components/organism/RegisterForm"
import Title from "@/components/atoms/Title"
import { Head } from "@inertiajs/react"

export default function Login() {
  return (
    <>
    <Head title="Sign In"/>
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
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
    </>
  )
}

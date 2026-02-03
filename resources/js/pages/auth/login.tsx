import LoginForm from "@/components/organism/LoginForm"
import Title from "@/components/atoms/Title"

export default function Login() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

      <div
        className="hidden md:block bg-cover bg-center"
        style={{
          backgroundImage: "url('/assets/landscape.jpeg')",
        }}
      />
      <div className="flex items-center justify-center px-6">
        <div className="w-full max-w-md space-y-5">
          <Title as="h2">Login to </Title>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

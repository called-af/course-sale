import LoginForm from "@/components/organism/LoginForm"

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
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-2xl font-semibold">
            Login
          </h1>
          <LoginForm />
        </div>
      </div>

    </div>
  )
}

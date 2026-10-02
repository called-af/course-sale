import { Head } from "@inertiajs/react"
import AdminLayout from "@/components/templates/AdminLayout"
import Title from "@/components/atoms/Title"
import UserProfile from "@/components/organisms/UserProfile"
import type { User } from "@/types/user"
import BreadCrumb from "@/components/atoms/BreadCrumb"

export default function Profile({ user }: { user: User }) {
  return (
    <>
      <Head title={`Edit ${user.name}`} />

      <div className="max-w-8xl mx-auto space-y-8">
        
        <BreadCrumb
          items={[
            {
              label: user.name
            }
          ]}
        />

        <div>
          <Title as='h3'>
            User Profile
          </Title>
          <p className="text-sm text-neutral-500">
            Manage account information and security settings.
          </p>
        </div>

        <UserProfile user={user} />
      </div>
    </>
  )
}

Profile.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
)
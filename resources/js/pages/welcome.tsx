import { Head } from '@inertiajs/react';
import WelcomeLayout from '@/components/templates/WelcomeLayout';

export default function Welcome() {
  return (
    <>
    <Head title='Welcome to our digital course'/>
      <section className=''>
        <div>

        </div>
      </section>
      <section>

      </section>
      <section>
        
      </section>
    </>
  );
}

Welcome.layout = (page: React.ReactNode) => (
  <WelcomeLayout>{page}</WelcomeLayout>
)
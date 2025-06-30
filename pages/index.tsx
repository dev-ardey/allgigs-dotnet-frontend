import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        router.push('/dashboard');
    }, [router]);

    return (
        <div style={{

        }}>
            <div style={{

            }}>
                {/* <h1>Redirecting to Dashboard...</h1>
                <p>Please wait while we take you to your dashboard.</p> */}
            </div>
        </div>
    );
} 
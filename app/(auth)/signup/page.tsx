import { AuthController } from "../_component/AuthController";
import { AuthMode, UserRole } from "@/types";


export default async function Page({ searchParams }: { searchParams: { role?: string } }) {
    const params = await searchParams; 
    const role = params.role as UserRole;

    return <AuthController mode={AuthMode.SIGNUP} role={role} />;
}
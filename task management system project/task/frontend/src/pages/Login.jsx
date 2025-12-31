import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import SubmitButton from "../components/SubmitButton";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    
    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            await login(email, password);
            navigate("/dashboard");
        } catch (error) {
            console.log(error);
        }
    };


    return (
        <div className="flex w-screen h-screen bg-base-100">

            <div className="flex flex-col items-center justify-center w-[50%] p-8">
                <h2 className="text-2xl font-bold mb-6">Hey, Welcome Back!</h2>
                <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-md">
                    <div>
                        <label className="block font-medium mb-2">Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="input input-bordered w-full bg-base-200"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block font-medium mb-2">Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            className="input input-bordered w-full bg-base-200"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <SubmitButton value={"Login"}/>

                    <div className="flex flex-col justify-center items-center gap-1.5 m-1.5">
                        <p>Don't have an account?</p>
                        <Link to="/signup" className="underline pointer-events-auto text-primary hover:text-primary-focus">Signup</Link>
                    </div>
                </form>
            </div>

            <div className="w-1/2 flex items-center justify-center">
                <div className="text-center text-white">
                    <h1 className="text-4xl font-bold mb-4">Task Manager</h1>
                    <p className="text-lg opacity-90">Organize your tasks efficiently</p>
                    <div className="mt-8 text-6xl">Task Manager</div>
                </div>
            </div>

        </div>
    );
};

export default Login;

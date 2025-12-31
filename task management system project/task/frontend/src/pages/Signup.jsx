import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import SubmitButton from "../components/SubmitButton.jsx";
import { Link } from "react-router-dom";


const Signup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { signup } = useAuth();
    const navigate = useNavigate();


    const handleSignup = async (e) => {
        e.preventDefault();

        try {
            await signup(name, email, password);
        } catch (error) {
        }
        navigate("/dashboard");
    };


    return (
        <div className="flex w-screen h-screen bg-base-100">

            <div className="flex flex-col items-center justify-center w-[50%] p-8">
                <h2 className="text-2xl font-bold mb-6">Sign Up</h2>
                <form onSubmit={handleSignup} className="flex flex-col gap-4 w-full max-w-md">
                    <label className="font-medium">Name</label>
                    <input
                        type="text"
                        placeholder="Name"
                        className="border bg-base-200 p-2 rounded-lg"
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <label className="font-medium">Email</label>
                    <input
                        type="email"
                        placeholder="Email"
                        className="border bg-base-200 p-2 rounded-lg"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <label className="font-medium">Password</label>
                    <input
                        type="password"
                        placeholder="Password"
                        className="border bg-base-200 p-2 rounded-lg"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <SubmitButton value={"Submit"}/>

                    <div className="flex flex-col justify-center items-center gap-1.5 m-1.5">
                        <p>already a user?</p>
                        <Link to="/login" className="underline pointer-events-auto">Login</Link>
                    </div>

                </form>

                

            </div>

            <div className="flex w-[50%] bg-base-100"></div>
        

        </div>
    );
};

export default Signup;

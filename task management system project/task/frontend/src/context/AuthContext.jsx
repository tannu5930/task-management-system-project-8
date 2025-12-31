import { createContext, useContext, useState, useEffect } from "react";
import API from "../library/api.js";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await API.get("/getuser");
                setUser(data);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const signup = async (name, email, password) => {

        try {
        await API.post("/signup", { name, email, password });
        const { data } = await API.get("/getuser");
        setUser(data);
        toast.success("Signup successful! Welcome");
        } catch (error) {
        toast.error(error.response?.data?.message || "Signup failed!");
        throw new Error("Invalid Credentials");
        }

    };

    const login = async (email, password) => {
        try {
            await API.post("/login", { email, password });
            const { data } = await API.get("/getuser");
            setUser(data);
  
            toast.success("Login successful!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid credentials!!!");
            throw new Error("Invalid Credentials");
        }
    };

    const logout = async () => {

        try {
            await API.post("/logout");
            setUser(null);
            toast.success("Logged out successfully!");
        } catch (error) {
            toast.error("Failed to logout!");
            throw new Error("Failed to logout!");
        }
    };

    return (
        <AuthContext.Provider value={{ loading, signup, login, user, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

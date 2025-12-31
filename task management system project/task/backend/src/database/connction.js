import mongoose from 'mongoose';

const conncetDB = async () => {
    
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI)
        console.log(`MongoDB Connected: ${conn.connection.host}\n`);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

export default conncetDB;
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log('\n' + '='.repeat(50));
    console.log(`🗃️ MongoDB Connected Successfully`);
    console.log(`📡 Database Host: ${conn.connection.host}`);
    console.log(`🔄 Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log('='.repeat(50) + '\n');
    
    // Monitor for database connection issues
    mongoose.connection.on('error', (err) => {
      console.error('\n' + '='.repeat(50));
      console.error(`❌ Database Connection Error: ${err.message}`);
      console.error('='.repeat(50) + '\n');
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('\n' + '='.repeat(50));
      console.warn('⚠️ Database Connection Lost');
      console.warn('🔄 Attempting to reconnect...');
      console.warn('='.repeat(50) + '\n');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('\n' + '='.repeat(50));
      console.log('✅ Database Connection Restored');
      console.log('='.repeat(50) + '\n');
    });
    
  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error(`❌ Database Connection Failed`);
    console.error(`📝 Error Details: ${error.message}`);
    
    if (error.name === 'MongoParseError') {
      console.error(`⚠️ Check your MONGO_URI in .env file`);
    } else if (error.name === 'MongoServerSelectionError') {
      console.error(`⚠️ Cannot reach MongoDB server. Check your network or MongoDB service.`);
    }
    
    console.error('='.repeat(50) + '\n');
    
    // Exit with failure in production, but allow retries in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;

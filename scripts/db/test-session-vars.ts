import { PrismaClient } from '@prisma/client';

async function testSessionVars() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('=== Testing Session Variables ===\n');
    
    // Test 1: Set a session variable and read it back in the same query
    console.log('Test 1: Set and read in the same query');
    const test1 = await prisma.$queryRaw`
      SELECT 
        set_config('app.test_var', 'test-value-123', false) as set_result,
        current_setting('app.test_var', true) as current_value;
    `;
    console.log('Result:', JSON.stringify(test1, null, 2));
    
    // Test 2: Read the session variable in a new query
    console.log('\nTest 2: Read in a new query');
    const test2 = await prisma.$queryRaw`
      SELECT current_setting('app.test_var', true) as current_value;
    `;
    console.log('Result:', JSON.stringify(test2, null, 2));
    
    // Test 3: Use a transaction to set and read the variable
    console.log('\nTest 3: Use a transaction');
    const test3 = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL app.test_var = 'test-value-tx'`;
      return tx.$queryRaw`SELECT current_setting('app.test_var', true) as current_value;`;
    });
    console.log('Result:', JSON.stringify(test3, null, 2));
    
    // Test 4: Read after transaction
    console.log('\nTest 4: Read after transaction');
    const test4 = await prisma.$queryRaw`
      SELECT current_setting('app.test_var', true) as current_value;
    `;
    console.log('Result:', JSON.stringify(test4, null, 2));
    
    // Test 5: Set with SESSION and read in new query
    console.log('\nTest 5: Set with SESSION and read in new query');
    await prisma.$executeRaw`SET SESSION app.test_var = 'test-value-session'`;
    const test5 = await prisma.$queryRaw`
      SELECT current_setting('app.test_var', true) as current_value;
    `;
    console.log('Result:', JSON.stringify(test5, null, 2));
    
    // Test 6: Read in a new client instance
    console.log('\nTest 6: Read in a new client instance');
    const prisma2 = new PrismaClient();
    const test6 = await prisma2.$queryRaw`
      SELECT current_setting('app.test_var', true) as current_value;
    `;
    console.log('Result:', JSON.stringify(test6, null, 2));
    await prisma2.$disconnect();
    
  } catch (error) {
    console.error('Error testing session variables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSessionVars().catch(console.error);

const BANK_DATABASE = {};
const TRANSACTION_DATABASE = {};
const USER_DATABASE = {};

/* User Management */
function createNewUser(name, dni) {
  for (const user of Object.values(USER_DATABASE)) {
    if (user.name === name && user.dni === dni) {
      throw new Error("This user already exists");
    }
  }

  const newUser = {
    id: Math.floor(Math.random() * 999),
    name,
    dni,
    accounts: [],
  };

  USER_DATABASE[newUser.id] = newUser;
  return newUser;
}

function getUser(userId) {
  if (!USER_DATABASE[userId]) throw new Error("User not found");
  return USER_DATABASE[userId];
}

function deleteUser(userId) {
  if (!USER_DATABASE[userId]) throw new Error("User not found");
  delete USER_DATABASE[userId];
}

/* Bank Account Management */
function createAccount(user, type = "SV", balance = 0) {
  if (!user) throw new Error("User is required");
  if (type !== "SV" && type !== "CU") {
    throw new Error("Account type must be 'SV' (Savings) or 'CU' (Current)");
  }

  const existingUser = getUser(user.id);
  if (!existingUser)
    throw new Error("User does not exist. Create a new user first.");

  const createAccountIdentifier = (userId, userName, type) => {
    if (!userId) throw new Error("User ID is required");
    if (!userName) throw new Error("User name is required");
    if (!type) throw new Error("Account type is required");
    return `${type}-${userName}-#${userId}`;
  };

  const accountIdentifier = createAccountIdentifier(
    existingUser.id,
    existingUser.name,
    type
  );
  const accountCreated = {
    accountIdentifier,
    linkedTo: user.id,
    type,
    balance,
  };

  BANK_DATABASE[accountIdentifier] = accountCreated;
  existingUser.accounts.push(accountIdentifier);
  return accountCreated;
}

function closeAccount(identifier) {
  if (!BANK_DATABASE[identifier]) throw new Error("Account not found");
  delete BANK_DATABASE[identifier];
}

function depositMoney(identifier, money) {
  if (!BANK_DATABASE[identifier]) throw new Error("Account not found");
  if (money <= 0) throw new Error("Deposit amount must be positive");
  BANK_DATABASE[identifier].balance += money;
  transactionHistory(identifier, "Deposit", {
    operation: "Deposit",
    amount: money,
  });
  return BANK_DATABASE[identifier].balance;
}

function transferMoney(from, to, money) {
  if (!BANK_DATABASE[from]) throw new Error("Source account not found");
  if (!BANK_DATABASE[to]) throw new Error("Destination account not found");
  if (money <= 0) throw new Error("Transfer amount must be positive");
  if (BANK_DATABASE[from].balance < money)
    throw new Error("Insufficient funds");

  BANK_DATABASE[from].balance -= money;
  BANK_DATABASE[to].balance += money;
  transactionHistory(from, "Transfer", {
    operation: "Transfer",
    to,
    amount: money,
  });
  return BANK_DATABASE[to].balance;
}

function withdrawMoney(identifier, money) {
  if (!BANK_DATABASE[identifier]) throw new Error("Account not found");
  if (money <= 0) throw new Error("Withdrawal amount must be positive");
  if (BANK_DATABASE[identifier].balance < money)
    throw new Error("Insufficient funds");

  BANK_DATABASE[identifier].balance -= money;
  transactionHistory(identifier, "Withdraw", {
    operation: "Withdraw",
    amount: money,
  });
  return BANK_DATABASE[identifier].balance;
}

function getBalance(identifier) {
  if (!BANK_DATABASE[identifier]) throw new Error("Account not found");
  return BANK_DATABASE[identifier].balance;
}

function transactionHistory(identifier, transactionType, data) {
  if (!BANK_DATABASE[identifier]) throw new Error("Account not found");
  if (
    transactionType !== "Transfer" &&
    transactionType !== "Withdraw" &&
    transactionType !== "Deposit"
  ) {
    throw new Error("Valid transaction types: Transfer, Withdraw, Deposit");
  }

  if (!TRANSACTION_DATABASE[identifier]) {
    TRANSACTION_DATABASE[identifier] = [];
  }
  TRANSACTION_DATABASE[identifier].push({
    type: transactionType,
    ...data,
    timestamp: new Date(),
  });
  return TRANSACTION_DATABASE[identifier];
}


console.log("=== Testing Simple Banking System ===");

// Test 1: Create a new user
console.log("\nTest 1: Creating a new user");
try {
  const user1 = createNewUser("Alice", "12345");
  console.log("User created:", user1);
} catch (error) {
  console.error("Error:", error.message);
}

// Test 2: Create a duplicate user
console.log("\nTest 2: Attempting to create a duplicate user");
try {
  createNewUser("Alice", "12345");
} catch (error) {
  console.error("Error:", error.message);
}

// Test 3: Create an account for the user
console.log("\nTest 3: Creating a savings account");
try {
  const account1 = createAccount(USER_DATABASE[Object.keys(USER_DATABASE)[0]], "SV", 100);
  console.log("Account created:", account1);
} catch (error) {
  console.error("Error:", error.message);
}

// Test 4: Deposit money
console.log("\nTest 4: Depositing $50");
try {
  const identifier = Object.keys(BANK_DATABASE)[0];
  const newBalance = depositMoney(identifier, 50);
  console.log("New balance after deposit:", newBalance);
  console.log("Transaction history:", TRANSACTION_DATABASE[identifier]);
} catch (error) {
  console.error("Error:", error.message);
}

// Test 5: Withdraw money
console.log("\nTest 5: Withdrawing $30");
try {
  const identifier = Object.keys(BANK_DATABASE)[0];
  const newBalance = withdrawMoney(identifier, 30);
  console.log("New balance after withdrawal:", newBalance);
  console.log("Transaction history:", TRANSACTION_DATABASE[identifier]);
} catch (error) {
  console.error("Error:", error.message);
}

// Test 6: Create a second account and transfer money
console.log("\nTest 6: Creating a second account and transferring $20");
try {
  const user1 = USER_DATABASE[Object.keys(USER_DATABASE)[0]];
  const account2 = createAccount(user1, "CU", 0);
  console.log("Second account created:", account2);
  const from = Object.keys(BANK_DATABASE)[0];
  const to = Object.keys(BANK_DATABASE)[1];
  const newBalance = transferMoney(from, to, 20);
  console.log("Balance of destination after transfer:", newBalance);
  console.log("Source account balance:", BANK_DATABASE[from].balance);
  console.log("Transaction history (source):", TRANSACTION_DATABASE[from]);
} catch (error) {
  console.error("Error:", error.message);
}

// Test 7: Check balance
console.log("\nTest 7: Checking balance");
try {
  const identifier = Object.keys(BANK_DATABASE)[0];
  const balance = getBalance(identifier);
  console.log("Current balance:", balance);
} catch (error) {
  console.error("Error:", error.message);
}

// Test 8: Delete user and account
console.log("\nTest 8: Deleting user and account");
try {
  const userId = Object.keys(USER_DATABASE)[0];
  const accountId = Object.keys(BANK_DATABASE)[0];
  closeAccount(accountId);
  deleteUser(userId);
  console.log("User and account deleted. USER_DATABASE:", USER_DATABASE);
  console.log("BANK_DATABASE:", BANK_DATABASE);
} catch (error) {
  console.error("Error:", error.message);
}

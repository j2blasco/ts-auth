# @j2blasco/ts-auth

A TypeScript authentication abstraction library that eliminates vendor lock-in and provides mock-free testing for both frontend and backend authentication systems.

## 🎯 Why This Library?

**Problem**: Authentication providers (Firebase, Auth0, AWS Cognito) lock you into their specific APIs, making switching providers painful and testing complex.

**Solution**: A simple abstraction layer with complete testing implementations that work with any authentication provider.

## 🚀 Key Features

- **🔓 Vendor Independence**: Switch between Firebase, Auth0, AWS Cognito, or any provider without changing business logic
- **🎭 No More Mocks**: Real testing implementations instead of fragile mocks
- **🔄 Frontend + Backend**: Separate interfaces for client and server concerns
- **✅ Contract Testing**: Comprehensive test suites ensure implementations work correctly
- **📦 TypeScript First**: Full type safety with Result types for error handling
- **🧩 Minimal API**: Simple interfaces focusing on common authentication operations

## 📦 Installation

```bash
npm install @j2blasco/ts-auth
```

## 🏗️ Architecture

The library provides separate interfaces for frontend and backend concerns:

### Frontend Components
- **`IAuthFrontend`**: Client-side operations (login, signup, password reset)
- **`AuthFrontendTesting`**: Complete frontend testing implementation
- **`testAuthFrontend`**: Test suite for validating frontend implementations

### Backend Components  
- **`IAuthBackend`**: Server-side operations (token validation, user management)
- **`AuthBackendTesting`**: Complete backend testing implementation
- **`testAuthBackend`**: Test suite for validating backend implementations

## 🔧 Quick Start

### Frontend Usage

```typescript
import { IAuthFrontend, AuthFrontendTesting } from '@j2blasco/ts-auth';

// In your tests - no mocks needed!
const auth = new AuthFrontendTesting();
auth.addTestUser('test@example.com', 'password123');

await auth.signInWithEmailAndPassword({
  email: 'test@example.com',
  password: 'password123',
  persistent: true
});

// In production - implement the interface for your provider
class FirebaseAuthFrontend implements IAuthFrontend {
  // Implement all methods...
}
```

### Backend Usage

```typescript
import { IAuthBackend, AuthBackendTesting } from '@j2blasco/ts-auth';

// In your tests
const backendAuth = new AuthBackendTesting();

const result = await backendAuth.signUpWithEmailPassword({
  email: 'user@example.com',
  password: 'password123'
});

const uid = result.unwrap().uid;

// In production - implement for your provider
class FirebaseAuthBackend implements IAuthBackend {
  // Implement all methods...
}
```

### Testing Your Implementations

```typescript
import { testAuthFrontend, testAuthBackend } from '@j2blasco/ts-auth';

describe('My Auth Implementation', () => {
  // Frontend tests - comprehensive suite
  testAuthFrontend(() => new MyFirebaseAuthFrontend());
  
  // Backend tests - comprehensive suite  
  testAuthBackend(new MyFirebaseAuthBackend());
});
```

## 🔍 Repository Structure

```
src/
├── frontend/
│   ├── core/
│   │   ├── auth-frontend.interface.ts          # Frontend interface definition
│   │   └── auth-frontend.generic.test.ts       # Generic test suite
│   └── providers/
│       └── testing/
│           ├── auth-frontend.testing.ts        # Testing implementation
│           └── auth-frontend.testing.test.ts   # Implementation tests
├── backend/
│   ├── core/
│   │   ├── auth-backend.interface.ts           # Backend interface definition
│   │   └── auth-backend.generic.test.ts        # Generic test suite
│   └── providers/
│       └── testing/
│           ├── auth-backend.testing.ts         # Testing implementation
│           └── auth-backend.testing.test.ts    # Implementation tests
└── index.ts                                    # Public exports
```

## 📋 Interface Overview

### Frontend Interface (`IAuthFrontend`)

User-facing authentication operations:

- `authState$` - Observable authentication state
- `signInWithEmailAndPassword()` - User login
- `signUp()` - User registration  
- `signOut()` - User logout
- `getIdToken()` - Get current user token
- `isEmailAvailable()` - Check email availability
- `changeEmail()` - Update user email
- `deleteAccount()` - Delete user account
- `triggerResetPasswordFlow()` - Initiate password reset
- `requestChangePassword()` - Complete password change

### Backend Interface (`IAuthBackend`)

Server-side authentication operations:

- `onUserCreated$` / `onUserDeleted$` - User lifecycle events
- `getUidFromIdToken()` - Validate and extract UID from token
- `signInWithEmailAndPassword()` - Administrative signin
- `signInWithRefreshToken()` - Token refresh
- `signUpWithEmailPassword()` - Administrative user creation
- `changeEmail()` - Administrative email change
- `changePassword()` - Administrative password change
- `deleteUser()` - Administrative user deletion
- `getUidByEmail()` - Lookup user by email

## 🧪 Testing Philosophy

This library follows **Test-Driven Development** principles:

1. **Interface-First**: Define the contract before implementation
2. **Real Objects Over Mocks**: Use complete implementations instead of mocks
3. **Contract Testing**: Generic test suites validate any implementation
4. **Fail Fast**: Comprehensive error handling with Result types

## 🔧 Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/j2blasco/ts-auth.git
cd ts-auth
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run frontend tests only
npm test -- src/frontend

# Run backend tests only  
npm test -- src/backend
```

### Building

```bash
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Write tests first (TDD approach)
4. Implement your feature
5. Ensure all tests pass: `npm test`
6. Submit a pull request

## 🛠️ Example Implementations

Want to see real implementations? Check out these examples:

- Firebase Implementation *(coming soon)*
- Auth0 Implementation *(coming soon)*  
- AWS Cognito Implementation *(coming soon)*

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙋 Support

- **Issues**: [GitHub Issues](https://github.com/j2blasco/ts-auth/issues)
- **Discussions**: [GitHub Discussions](https://github.com/j2blasco/ts-auth/discussions)

---

**Built with ❤️ for developer freedom and testing sanity.**


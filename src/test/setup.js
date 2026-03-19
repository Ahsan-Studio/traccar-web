// Vitest setup file
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock react-redux
vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
  useDispatch: vi.fn(),
}));

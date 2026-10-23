import { standardCategories } from '../src/screens/AdminScreen';

describe('Admin product categories', () => {
  it('includes standard retail categories', () => {
    expect(standardCategories).toContain('Shoes');
    expect(standardCategories).toContain('Bags');
    expect(standardCategories).toContain('Tech');
    expect(standardCategories).toContain('Fashion');
    expect(standardCategories).toContain('Accessories');
    expect(standardCategories).toContain('Other');
  });
});

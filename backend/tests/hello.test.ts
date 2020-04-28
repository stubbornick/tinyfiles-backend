describe('hello', function () {
    it('world', function () {
        const result = 'Hello, World!';
        expect(result.slice(0, 5)).toBe('Hello');
    });
});

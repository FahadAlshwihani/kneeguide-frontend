import {
  saveAuthData,
  getToken,
  getUserFromStorage,
  clearAuthData,
} from "./storage";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("saveAuthData persists both token and user", () => {
    saveAuthData("abc123", { id: 1, name: "Jane" });

    expect(getToken()).toBe("abc123");
    expect(getUserFromStorage()).toEqual({ id: 1, name: "Jane" });
  });

  test("saveAuthData skips writing falsy token/user", () => {
    saveAuthData(null, null);

    expect(getToken()).toBeNull();
    expect(getUserFromStorage()).toBeNull();
  });

  test("getUserFromStorage returns null when nothing is stored", () => {
    expect(getUserFromStorage()).toBeNull();
  });

  test("getUserFromStorage returns null and does not throw on corrupt JSON", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("user", "{not-valid-json");

    expect(getUserFromStorage()).toBeNull();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  test("clearAuthData removes both token and user", () => {
    saveAuthData("abc123", { id: 1 });
    clearAuthData();

    expect(getToken()).toBeNull();
    expect(getUserFromStorage()).toBeNull();
  });
});

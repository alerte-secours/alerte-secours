describe("App Initialization", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should have main layout", async () => {
    await expect(element(by.id("main-layout"))).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
const catalog = JSON.parse(fs.readFileSync("app/institutions.json"));
const ufpe = Object.values(catalog.institutions).find(
  (i) => i.acronym === "UFPE",
);
const fixture = (sql) =>
  execFileSync("php", [
    "-r",
    '$db=new PDO("sqlite:.runtime/mdstrike.sqlite");$db->exec($argv[1]);',
    sql,
  ]);
test.beforeAll(async ({ request }) => {
  await request.get("/api/index.php?action=session");
  fixture("DELETE FROM md_auth_limits");
});

test("optional education cascades by location, persists privately, preserves legacy and supports manual and guest entry", async ({
  page,
  context,
}) => {
  let csrf = (
    await (await context.request.get("/api/index.php?action=session")).json()
  ).csrf;
  const post = (action, data) =>
    context.request.post("/api/index.php?action=" + action, {
      headers: { "X-CSRF-Token": csrf },
      data,
    });
  const registered = await (
    await post("register", {
      nickname: "edu_" + Date.now(),
      email: Date.now() + "@example.test",
      password: "Education-Test-12345",
      consent: true,
    })
  ).json();
  csrf = registered.csrf;
  const profile = async () =>
    (await (await context.request.get("/api/index.php?action=profile")).json())
      .user;
  expect((await profile()).education).toBeNull();
  await post("update-profile", {
    nickname: registered.user.nickname,
    institution: "Instituição anterior",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#profile");
  const form = page.locator("#profile-form"),
    fields = page.locator("#education-fields");
  await expect(fields.locator("[name=educationStatus]")).toHaveValue("keep");
  await form
    .getByRole("button", { name: "Salvar perfil", exact: true })
    .click();
  await expect(page.locator("#toast")).toContainText("Perfil atualizado");
  expect((await profile()).institution).toBe("Instituição anterior");
  await fields.locator("[name=educationStatus]").selectOption("studying");
  await fields.locator("[data-education-manual]").uncheck();
  await expect(fields.locator("[name=educationState] option")).toHaveCount(28);
  await fields.locator("[name=educationState]").selectOption("PE");
  await fields.locator("[name=educationMunicipality]").selectOption("2611606");
  await fields.locator("[name=educationInstitution]").selectOption(ufpe.id);
  await form
    .getByRole("button", { name: "Salvar perfil", exact: true })
    .click();
  await expect(page.locator("#toast")).toContainText("Perfil atualizado");
  expect((await profile()).education).toMatchObject({
    institutionId: ufpe.id,
    institution: ufpe.name,
    state: "PE",
    municipalityId: "2611606",
    status: "studying",
  });
  await page.reload();
  await expect(fields.locator("[name=educationInstitution]")).toHaveValue(
    ufpe.id,
  );
  await page.screenshot({
    path: "/private/tmp/mdstrike-education-desktop.png",
    fullPage: false,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(fields.locator("[name=educationInstitution]")).toHaveValue(
    ufpe.id,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await fields.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "/private/tmp/mdstrike-education-mobile.png",
    fullPage: false,
  });
  await fields.locator("[name=educationState]").selectOption("SP");
  await expect(fields.locator("[name=educationMunicipality]")).toHaveValue("");
  await expect(fields.locator("[name=educationInstitution]")).toBeDisabled();
  const base = {
    nickname: registered.user.nickname,
    educationStatus: "studying",
    educationMode: "listed",
    educationState: "PE",
    educationMunicipality: "2611606",
    educationInstitution: ufpe.id,
  };
  expect(
    (
      await post("update-profile", {
        ...base,
        educationState: "SP",
        nickname: "must_not_be_saved",
      })
    ).status(),
  ).toBe(400);
  expect((await profile()).nickname).toBe(registered.user.nickname);
  expect(
    (
      await post("update-profile", { ...base, educationInstitution: "1" })
    ).status(),
  ).toBe(400);
  expect(
    (await post("update-profile", { ...base, educationStatus: [] })).status(),
  ).toBe(400);
  await post("update-profile", { ...base, institution: "forged-name" });
  expect((await profile()).education.institution).toBe(ufpe.name);
  const manual =
    'Faculdade <img src=x onerror="window.educationInjected=true">';
  const saved = await post("update-profile", {
    nickname: registered.user.nickname,
    educationStatus: "graduated",
    educationMode: "manual",
    institution: manual,
  });
  expect(saved.status()).toBe(200);
  await page.reload();
  await expect(fields.locator("[name=institution]")).toHaveValue(manual);
  expect(await fields.locator("img").count()).toBe(0);
  expect(await page.evaluate(() => !!window.educationInjected)).toBe(false);
  const publicText = await (
    await context.request.get("/api/index.php?action=leaderboard")
  ).text();
  expect(publicText).not.toMatch(
    /education|institution|municipality|education_status/,
  );
  fixture(
    `INSERT INTO md_admins(user_id,granted_at) VALUES (${Number(registered.user.id)},${Math.floor(Date.now() / 1000)})`,
  );
  const admin = await context.request.get(
    "/api/index.php?action=admin-user&id=" + registered.user.id,
  );
  expect(admin.status()).toBe(200);
  expect((await admin.json()).user.education.status).toBe("graduated");
  fixture(`DELETE FROM md_admins WHERE user_id=${Number(registered.user.id)}`);
  await fields.locator("[name=educationStatus]").selectOption("");
  await form
    .getByRole("button", { name: "Salvar perfil", exact: true })
    .click();
  await expect(page.locator("#toast")).toContainText("Perfil atualizado");
  expect((await profile()).education).toBeNull();
  expect((await profile()).institution).toBe("");
  await page.locator("#logout-button").click();
  await expect(page.locator("#logout-button")).toBeHidden();
  await expect(page).toHaveURL(/#lobby$/);
  await page.goto("/#profile");
  await fields.locator("[name=educationStatus]").selectOption("graduated");
  await fields.locator("[data-education-manual]").check();
  await fields.locator("[name=institution]").fill("Faculdade no exterior");
  await form
    .getByRole("button", { name: "Salvar perfil", exact: true })
    .click();
  await expect(page.locator("#toast")).toContainText("Perfil atualizado");
  await page.reload();
  await expect(fields.locator("[name=institution]")).toHaveValue(
    "Faculdade no exterior",
  );
  expect(errors).toEqual([]);
});

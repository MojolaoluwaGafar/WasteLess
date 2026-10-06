import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { LogOut, MapPin, Phone } from "lucide-react";
import type { AccountType } from "../types";
import { authService } from "../API/services/authService";
import { useAuth } from "../Context/AuthContext";
import Button from "../Components/Button";
import { ChipGroup, Field, TextInput } from "../Components/Field";
import { apiErrorMessage, apiFieldErrors } from "../utils/apiError";
import { showToast } from "../utils/toastHelper";

export default function AccountPage() {
  const { user, setUser, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    location: user?.location ?? "",
    accountType: user?.accountType ?? ("individual" as AccountType),
    orgName: user?.orgName ?? "",
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) return null;

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileErrors({});
    try {
      setUser(await authService.updateProfile(profile));
      showToast("Profile saved.");
    } catch (err) {
      setProfileErrors(apiFieldErrors(err));
      showToast(apiErrorMessage(err, "Couldn't save your profile."), "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passwords.newPassword.length < 8) return setPasswordErrors({ newPassword: "Use at least 8 characters." });
    setSavingPassword(true);
    setPasswordErrors({});
    try {
      signIn(await authService.changePassword(passwords.currentPassword, passwords.newPassword));
      setPasswords({ currentPassword: "", newPassword: "" });
      showToast("Password changed. Other devices have been signed out.");
    } catch (err) {
      setPasswordErrors(apiFieldErrors(err));
      showToast(apiErrorMessage(err, "Couldn't change your password."), "error");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-[760px] px-4 pt-8 md:px-8 md:pt-12">
      <h1 className="font-serif text-4xl font-semibold text-forest">Account settings</h1>
      <p className="mt-1 text-on-surface-variant">{user.email}</p>

      <form onSubmit={saveProfile} className="mt-8 space-y-4 rounded-[32px] bg-white p-6 shadow-card ring-1 ring-forest/5" noValidate>
        <h2 className="font-serif text-xl font-semibold text-forest">Profile</h2>
        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-on-surface">Account type</span>
          <ChipGroup<AccountType>
            label="Account type"
            className="flex-wrap"
            value={profile.accountType}
            onChange={(accountType) => setProfile({ ...profile, accountType })}
            options={[
              { value: "individual", label: "Individual" },
              { value: "business", label: "Business" },
              { value: "organisation", label: "Organisation" },
            ]}
          />
        </div>
        {profile.accountType !== "individual" && (
          <Field label={profile.accountType === "business" ? "Business name" : "Organisation name"} htmlFor="orgName" error={profileErrors.orgName}>
            <TextInput id="orgName" value={profile.orgName} onChange={(event) => setProfile({ ...profile, orgName: event.target.value })} maxLength={80} hasError={Boolean(profileErrors.orgName)} />
          </Field>
        )}
        <Field label="Name" htmlFor="name" error={profileErrors.name}>
          <TextInput id="name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} maxLength={60} hasError={Boolean(profileErrors.name)} />
        </Field>
        <Field label="Phone" htmlFor="phone" optional error={profileErrors.phone} hint="Only shared with someone after you accept their request (or they accept yours). Enables WhatsApp.">
          <TextInput id="phone" type="tel" autoComplete="tel" icon={<Phone className="h-4.5 w-4.5" />} value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="+234 801 234 5678" hasError={Boolean(profileErrors.phone)} />
        </Field>
        <Field label="Your area" htmlFor="location" optional hint="Filled in on new listings for you.">
          <TextInput id="location" icon={<MapPin className="h-4.5 w-4.5" />} value={profile.location} onChange={(event) => setProfile({ ...profile, location: event.target.value })} maxLength={80} placeholder="e.g. Yaba, Lagos" />
        </Field>
        <Button type="submit" loading={savingProfile}>
          Save profile
        </Button>
      </form>

      <form onSubmit={savePassword} className="mt-6 space-y-4 rounded-[32px] bg-white p-6 shadow-card ring-1 ring-forest/5" noValidate>
        <h2 className="font-serif text-xl font-semibold text-forest">{user.hasPassword ? "Change password" : "Add a password"}</h2>
        {!user.hasPassword && <p className="text-sm text-on-surface-variant">You sign in with Google. Add a password to sign in with your email too.</p>}
        {user.hasPassword && (
          <Field label="Current password" htmlFor="currentPassword" error={passwordErrors.currentPassword}>
            <TextInput id="currentPassword" type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} hasError={Boolean(passwordErrors.currentPassword)} />
          </Field>
        )}
        <Field label="New password" htmlFor="newPassword" error={passwordErrors.newPassword} hint="At least 8 characters. Other devices will be signed out.">
          <TextInput id="newPassword" type="password" autoComplete="new-password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} hasError={Boolean(passwordErrors.newPassword)} />
        </Field>
        <Button type="submit" variant="outline" loading={savingPassword}>
          {user.hasPassword ? "Change password" : "Add password"}
        </Button>
      </form>

      <div className="mt-6 flex justify-end">
        <Button
          variant="danger"
          onClick={() => {
            signOut();
            navigate("/");
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}

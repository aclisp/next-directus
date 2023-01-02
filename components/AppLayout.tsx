import { AppHeader, AppHeaderProps } from "./AppHeader";

export type AppLayoutProps = AppHeaderProps & {
  children: React.ReactNode;
};

export function AppLayout(props: AppLayoutProps) {
  const { children, ...headerProps } = props;
  return (
    <>
      <AppHeader {...headerProps} />
      <main>{children}</main>
    </>
  );
}

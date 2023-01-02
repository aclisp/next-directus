import { getIronSession } from "iron-session";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { AppHeaderProps } from "../components/AppHeader";
import { AppLayout } from "../components/AppLayout";
import { getCurrentUserInfo } from "../lib/directus/user";
import { sessionOptions } from "../lib/session";

export const getServerSideProps: GetServerSideProps<AppHeaderProps> = async (
  context,
) => {
  const session = await getIronSession(
    context.req,
    context.res,
    sessionOptions,
  );
  if (session.loginInfo) {
    const userInfo = await getCurrentUserInfo(session);
    return {
      props: {
        isLogin: true,
        userInfo,
        accessToken: session.loginInfo.access_token,
      },
    };
  }
  return {
    props: {
      isLogin: false,
    },
  };
};

export default function Home(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return (
    <AppLayout {...props}>
      <p>hello world</p>
    </AppLayout>
  );
}

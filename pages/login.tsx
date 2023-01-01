import { Box, Button, Group, PasswordInput, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import Image from "next/image";
import { IconCheck, IconX } from "@tabler/icons";

export default function Login() {
  const form = useForm({
    initialValues: {
      username: "",
      password: "",
    },
    validate: {
      username: (
        value,
      ) => (/^\S+@\S+\.\S+$/.test(value) ? null : "Invalid email"),
    },
  });

  const onSubmit = form.onSubmit(async (values) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    if (!response.ok) {
      showNotification({
        title: `${response.status} ${response.statusText}`,
        message: data.message,
        color: "red",
        icon: <IconX />,
      });
    } else {
      showNotification({
        title: `${response.status} ${response.statusText}`,
        message: data.message,
        color: "green",
        icon: <IconCheck />,
      });
    }
  });

  return (
    <Box sx={{ maxWidth: 300 }} mx="auto">
      <Image
        src="/login-banner.webp"
        alt=""
        width={300}
        height={300}
      />
      <form onSubmit={onSubmit}>
        <TextInput
          withAsterisk
          label="Email"
          placeholder="your@email.com"
          {...form.getInputProps("username")}
        />
        <PasswordInput
          withAsterisk
          label="Password"
          placeholder="your password"
          {...form.getInputProps("password")}
        />
        <Group position="right" mt="md">
          <Button type="submit">Login</Button>
        </Group>
      </form>
    </Box>
  );
}

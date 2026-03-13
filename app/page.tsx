import Authorized from "@/components/Authorized";

export default function Home() {
  return (
    <Authorized>
      <h1 className="text-dark dark:text-white">Home Page</h1>
    </Authorized>
  );
}
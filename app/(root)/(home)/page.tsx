import ClientTime from "@/components/ClientTime";
import MeetingTypeList from "@/components/MeetingTypeList";

const Home = () => {
  const now = new Date();

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = new Intl.DateTimeFormat([], { dateStyle: "full" }).format(now);

  return (
    <section className="flex size-full flex-col gap-5 text-white">
      <div className="h-[303px] w-full rounded-[20px] bg-hero bg-cover">
        <div className="flex h-full flex-col justify-between max-md:px-5 max-md:py-8 lg:p-11">
          <h2 className="glassmorphism max-w-[273px] rounded py-2 text-center text-base font-normal">
            Upcoming Meeting at: 12:30 PM
          </h2>
          <ClientTime />
        </div>
      </div>
      <MeetingTypeList />
    </section>
  );
};

export default Home;

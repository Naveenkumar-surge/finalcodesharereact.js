import React from "react";
import { v4 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";
import { Code, Image, FileText, Video, Share2 } from "lucide-react";

const JoinCreateRoom = ({ setUser, setRoomJoined }) => {
  const navigate = useNavigate();

  const handleQuickShare = () => {
    const newRoomId = Math.floor(100000 + Math.random() * 900000).toString();

    const userData = {
      roomId: newRoomId,
      userId: uuid(),
      host: true,
      presenter: true,
    };

    localStorage.setItem("whiteboardUser", JSON.stringify(userData));
    setUser(userData);
    setRoomJoined(true);
    navigate(`/${newRoomId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      {/* HERO */}
      <header className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20 shadow-md">
        <div className="max-w-6xl mx-auto text-center px-6">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
            QuickShare
          </h1>
          <p className="mt-4 text-xl sm:text-2xl opacity-95 max-w-2xl mx-auto">
            Share <span className="font-semibold">images</span>,{" "}
            <span className="font-semibold">videos</span>,{" "}
            <span className="font-semibold">text</span>,{" "}
            <span className="font-semibold">code</span>, and{" "}
            <span className="font-semibold">documents</span> in seconds 🚀
          </p>
          <button
            onClick={handleQuickShare}
            className="mt-8 px-10 py-4 bg-green-500 text-white rounded-2xl text-xl font-semibold shadow-lg hover:scale-105 hover:bg-green-600 transition"
          >
            ⚡ Start Quick Share
          </button>
        </div>
      </header>
      {/* FEATURES */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12">
            Why Developers Love QuickShare 💻
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <Image className="w-10 h-10 text-blue-600" />,
                title: "Share Images",
                desc: "Upload and showcase screenshots, designs, or artwork instantly.",
              },
              {
                icon: <Video className="w-10 h-10 text-green-600" />,
                title: "Stream Videos",
                desc: "Quickly share video content without lengthy uploads.",
              },
              {
                icon: <Code className="w-10 h-10 text-purple-600" />,
                title: "Collaborate on Code",
                desc: "Paste snippets or entire files for instant peer review.",
              },
              {
                icon: <FileText className="w-10 h-10 text-red-600" />,
                title: "Share Documents",
                desc: "Docs, PDFs, notes — all shared securely in one click.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-2xl p-8 shadow hover:shadow-xl transition border border-gray-200"
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO VIDEO */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            See QuickShare in Action 🎥
          </h2>
          <p className="mb-10 text-gray-600 text-lg max-w-2xl mx-auto">
            Watch how teams and developers use QuickShare for instant
            collaboration across the globel.
          </p>
          <div className="w-full h-64 sm:h-96 bg-black rounded-2xl overflow-hidden shadow-lg">
            <video
              controls
              className="w-full h-full object-cover"
              poster="https://via.placeholder.com/800x400.png?text=QuickShare+Demo"
            >
              <source src="videos/demo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-700 to-purple-700 text-white text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Ready to Share Instantly?
        </h2>
        <p className="text-lg opacity-90 mb-6 max-w-xl mx-auto">
          Join thousands of developers who collaborate faster with QuickShare.
        </p>
        <button
          onClick={handleQuickShare}
          className="px-10 py-4 bg-green-500 text-white rounded-2xl text-xl font-semibold shadow-lg hover:scale-105 hover:bg-green-600 transition"
        >
          🚀 Start Quick Share Now
        </button>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-8 text-center">
        <div className="flex flex-col items-center">
          <img
            src="images/imageself.jpg" // Replace with your photo
            alt="Naveen"
            className="w-20 h-20 rounded-full mb-3 border-4 border-white shadow-md"
          />
          <p className="text-lg font-semibold">Designed with ❤️ by P Naveen Kumar</p>
          <p className="text-sm mt-1 text-gray-400">
            Crafted for developers & creators worldwide 🌍
          </p>
        </div>
      </footer>
    </div>
  );
};

export default JoinCreateRoom;

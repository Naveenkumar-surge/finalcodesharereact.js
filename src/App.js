import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import io from "socket.io-client";

import ClientRoom from "./ClientRoom";
import JoinCreateRoom from "./Homepage";
import Room from "./Room";
import "./style.css";

const server = "https://codesharenodejs-2.onrender.com/";
const connectionOptions = {
  "force new connection": true,
  reconnectionAttempts: Infinity,
  timeout: 10000,
  transports: ["websocket"],
};

const App = () => {
  const [userNo, setUserNo] = useState(0);
  const [user, setUser] = useState({});
  const [users, setUsers] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [roomJoined, setRoomJoined] = useState(false); // ✅ Added this state

  // ✅ Keep socket stable across renders
  const socket = useMemo(() => io(server, connectionOptions), []);

  const uuid = () => {
    const S4 = () =>
      (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    return `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;
  };

  // ✅ Emit user joined only once when ready
  useEffect(() => {
    if (roomId && user?.roomId) {
      socket.emit("user-joined", user);
    }
  }, [roomId, user?.roomId, socket, user]);

  return (
    <div className="home">
      <ToastContainer />
      <Routes>
        {/* Homepage */}
        <Route
          path="/"
          element={
            <JoinCreateRoom
              uuid={uuid}
              setUser={setUser}
              setRoomId={setRoomId}
              setRoomJoined={setRoomJoined}   // ✅ Passed down
            />
          }
        />

        {/* Presenter Room */}
        <Route
          path="/:roomId"
          element={
            <Room
              userNo={userNo}
              user={user}
              socket={socket}
              setUsers={setUsers}
              setUserNo={setUserNo}
              setRoomJoined={setRoomJoined}   // ✅ Passed down
            />
          }
        />

        {/* Client Room */}
        <Route
          path="/client/:roomId"
          element={
            <ClientRoom
              userNo={userNo}
              user={user}
              socket={socket}
              setUsers={setUsers}
              setUserNo={setUserNo}
              setRoomJoined={setRoomJoined}   // ✅ Passed down
            />
          }
        />
      </Routes>
    </div>
  );
};

export default App;

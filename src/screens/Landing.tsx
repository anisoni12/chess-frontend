import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { INIT_GAME } from "./Game";
import { useSocket } from "../hooks/useSocket";
import { useEffect, useState } from "react";

export const Landing = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if(!socket) return ;

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if(message.type === "waiting") {
        setWaiting(true);
    }

    if(message.type === INIT_GAME) {
      navigate("/game");
    }
  };
  }, [socket]);

  if(!socket) {
    return <div className="text-white text-center pt-8">Connecting...</div>;
  }


  return (
    <div className="flex justify-center">
      <div className="pt-8 max-w-screen-lg">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex justify-center ">
            <img src={"/chessBoard.jpeg"} className="max-w-96" />
          </div>
          <div className="pt-16">
            <div className="flex justify-center">
              <h1 className="text-4xl font-bold text-white">
                Play chess online on the #2 Site!{" "}
              </h1>
            </div>

            <div className="mt-8 flex justify-center">
              <Button onClick={() => navigate("/game")}>
                Play Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

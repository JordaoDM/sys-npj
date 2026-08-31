import React from "react";
import { useParams } from "react-router-dom";
import UpdateList from "../../components/atualizacoes/UpdateList";

export default function ProcessUpdatesPage() {
  const { id } = useParams();
  return (
    <div style={{ maxWidth: 700, margin: "auto", paddingTop: 40 }}>
      <UpdateList processoId={id} />
    </div>
  );
}

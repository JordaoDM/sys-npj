import React, { useState } from "react";
import useApi from "../../hooks/useApi.jsx";

const ProfileEditForm = () => {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const { request, loading, error } = useApi();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await request("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio }),
    });
    if (data) setSuccess(true);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Editar Perfil</h2>
      <input
        type="text"
        placeholder="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Bio"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      />
      <button type="submit" disabled={loading}>
        Salvar
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p>Perfil atualizado com sucesso!</p>}
    </form>
  );
};

export default ProfileEditForm;

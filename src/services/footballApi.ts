export const fetchWorldCupMatches =
  async () => {
    try {
      const response =
        await fetch(
          "/api/matches",
          {
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        console.error(
          "Matches API Error:",
          data.error
        );

        return [];
      }

      return (
        data.matches || []
      );
    } catch (error) {
      console.error(
        "Football API Error:",
        error
      );

      return [];
    }
  };
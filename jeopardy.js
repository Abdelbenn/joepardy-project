const API_URL = "https://rithm-jeopardy.herokuapp.com/api/";

const NUMBER_OF_CATEGORIES = 6;

const NUMBER_OF_CLUES_PER_CATEGORY = 5;

let categories = [];

let activeClue = null;

let activeClueMode = 0;

let isPlayButtonClickable = true;

$("#play").on("click", handleClickOfPlay);

function handleClickOfPlay() {
  if (isPlayButtonClickable) {
    setupTheGame();
  }
}

async function setupTheGame() {
    try {
        console.log("Starting game setup..."); // Log start
        $("#spinner").show(); // Show the spinner
        $("#categories").empty();
        $("#clues").empty();
        $("#active-clue").html("");
        $("#show-answer").hide();
        $("#active-answer").html("").hide(); 
        $("#play").text("Loading...");

        const categories = await getCategoryIds();
        console.log("Fetched category IDs:", categories); // Log IDs

        const categoryData = [];
        for (const id of categories) {
            const category = await getCategoryData(id);
            console.log("Fetched category data:", category); // Log category data
            categoryData.push(category);
        }

        fillTable(categoryData);
        $("#play").text("Restart the Game!");
        $("#spinner").hide(); // Hide the spinner
    } catch (error) {
        console.error("Error setting up the game:", error);
        $("#spinner").hide(); // Hide spinner on error
    }
}

async function getCategoryIds() {
    try {
        // await axios.get(`https://rithm-jeopardy.herokuapp.com/api/categories? count=100`)
        const response = await axios.get(`${API_URL}categories?count=${NUMBER_OF_CATEGORIES}`);
        console.log("Categories response:", response.data); // Log full response
        return response.data.map(category => category.id);
    } catch (error) {
        console.error("Error fetching category IDs:", error); // Log error
    }
}

async function getCategoryData(categoryId) {
    try {
        const response = await axios.get(`${API_URL}category?id=${categoryId}`);
        console.log("Category data response:", response.data); // Log full response
        const data = response.data;

        return {
            id: categoryId,
            title: data.title,
            clues: data.clues.map(clue => ({
                id: clue.id,
                value: clue.value || 500 ,
                question: clue.question,
                answer: clue.answer,
            })).sort((a, b) => { return a.value - b.value}),
           
        };
    } catch (error) {
        console.error("Error fetching category data:", error); // Log error
    }
}
function fillTable(categories) {
    const $thead = $("#categories");
    const $tbody = $("#clues");

    $thead.empty();
    $tbody.empty();

    const $trHead = $("<tr></tr>");
    categories.forEach(category => {
        $trHead.append(`<th>${category.title}</th>`);
    });
    $thead.append($trHead);

    const maxClues = Math.max(...categories.map(category => category.clues.length));
    for (let i = 0; i < maxClues; i++) {
        const $trBody = $("<tr></tr>");
        categories.forEach(category => {
            const clue = category.clues[i];
            const $td = $("<td></td>");
            if (clue) {
                $td.attr("id", `category-${category.id}-clue-${clue.id}`);
                $td.addClass("clue");
                $td.text(clue.value);

                // Click event to show the question
                $td.on("click", function() {
                    $("#active-clue").data("answer", clue.answer); // Store the answer
                    $("#active-clue").data("clueId", clue.id); // Store the clue ID
                    $("#active-clue").text(clue.question).show(); // Show the question
                    $("#active-answer").text("").hide();; // Clear the answer div
                    $("#show-answer").show(); // Show the button
                });
                console.log(clue.answer);

                $trBody.append($td);
            } else {
                $trBody.append("<td></td>");
            }
        });
        $thead.append($trBody);
       
    }
}


    // Click event to show the answer when the question is clicked
    $("#show-answer").on("click", function() {
        const answer = $("#active-clue").data("answer"); // Get the answer from data
        if (answer) {
            $("#active-answer").text(answer).show();; // Show the answer
        }
        
        // Optional: Hide the answer button after showing the answer
        $("#active-clue").hide(); 
        $(this).hide(); 
    });
    function stripHtmlTags(str) {
        return str.replace(/<[^>]*>/g, ''); // Remove HTML tags
    }
    
    // When showing the answer
    $("#show-answer").on("click", function() {
        const answer = $("#active-clue").data("answer");
        if (answer) {
            $("#active-answer").text(stripHtmlTags(answer)).show(); // Strip tags before displaying
        }
    });



    $(".clue").on("click", handleClickOfClue);



function handleClickOfClue(event) {
  const [categoryId, clueId] = event.currentTarget.id.split("-").slice(1, 3);

  const categoryIndex = categories.findIndex(
    (category) => category.id == categoryId
  );

  const clueIndex = categories[categoryIndex].clues.findIndex(
    (clue) => clue.id == clueId
  ); // Remove the clue from categories

  const selectedClue = categories[categoryIndex].clues[clueIndex];

  categories[categoryIndex].clues.splice(clueIndex, 1); // Remove category if no clues are left

  if (categories[categoryIndex].clues.length === 0) {
    categories.splice(categoryIndex, 1);
  } // Mark clue as viewed

  $(event.currentTarget).addClass("viewed");

  activeClue = selectedClue;

  activeClueMode = 1; // Show question

  $("#active-clue").html(activeClue.question);
}

$("#active-clue").on("click", handleClickOfActiveClue);

function handleClickOfActiveClue(event) {
  if (activeClueMode === 1) {
    activeClueMode = 2;

    $("#active-clue").html(activeClue.answer);
  } else if (activeClueMode === 2) {
    activeClueMode = 0;

    $("#active-clue").html("");

    if (categories.length === 0) {
      isPlayButtonClickable = true;

      $("#play").text("Restart the Game!");

      $("#active-clue").html("The End!");
    }
  }
}
